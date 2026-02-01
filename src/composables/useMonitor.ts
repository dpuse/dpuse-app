/* eslint-disable unicorn/prefer-add-event-listener */

// Vendor dependencies
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// Workbench core
import type { WorkerMessageExceptionPayload, WorkerMessagePayload, WorkerMessageWebVitalPayload, WorkerResponse } from '@/workers/monitorWorker';

// Still experimental so no type definitions
type NavigatorConnection = { effectiveType?: string; downlink?: number; downlinkMax?: number; rtt?: number; saveData?: boolean; type?: string };
interface NavigatorWithConnection extends Navigator {
    connection?: NavigatorConnection;
    mozConnection?: NavigatorConnection;
    webkitConnection?: NavigatorConnection;
}

//
let activeUserId: string | undefined;
let messageId = 0;
type PendingWorkerMessage = { resolve: (payload: Record<string, unknown>) => void; reject: (reason?: unknown) => void };
const pendingMessageMap = new Map<number, PendingWorkerMessage>();
let worker: Worker | undefined;

// Composable
export function useMonitor() {
    return { cleanUp, initialise, logException, logPageView, resetUser };
}

// Operations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initialise(userId: string): Promise<unknown> {
    if (!worker) startWorker();

    activeUserId = userId;
    const requestId = ++messageId;
    return new Promise((resolve, reject) => {
        pendingMessageMap.set(requestId, { resolve, reject });
        const payload = constructCommonPayload();
        worker?.postMessage({ typeId: 'initialise', payload, meta: { requestId } });
    });
}

function resetUser(userId: string): Promise<Record<string, unknown>> {
    if (!worker) return Promise.reject('Attempt to reset user before initialisation.');

    activeUserId = userId;
    const requestId = ++messageId;
    return new Promise((resolve, reject) => {
        pendingMessageMap.set(requestId, { resolve, reject });
        const payload = constructCommonPayload();
        worker?.postMessage({ typeId: 'resetUser', payload, meta: { requestId } });
    });
}

function logPageView(): Promise<Record<string, unknown>> {
    if (!worker) return Promise.resolve({}); // TODO: Push to pending stack, up to a maximum number of page views...

    const requestId = ++messageId;
    return new Promise((resolve, reject) => {
        pendingMessageMap.set(requestId, { resolve, reject });
        const payload = constructCommonPayload();
        worker?.postMessage({ typeId: 'logPageView', payload, meta: { requestId } });
    });
}

function logException(error?: unknown): Promise<Record<string, unknown>> {
    if (!worker) return Promise.resolve({}); // TODO: Push to pending stack, up to a maximum number of exceptions...

    const requestId = ++messageId;
    return new Promise((resolve, reject) => {
        pendingMessageMap.set(requestId, { resolve, reject });
        const payload: WorkerMessageExceptionPayload = { ...constructCommonPayload(), error };
        worker?.postMessage({ typeId: 'logException', payload, meta: { requestId } });
    });
}

async function cleanUp(): Promise<void> {
    if (!worker) return;

    const requestId = ++messageId;
    const payload = constructCommonPayload();
    const cleanUpPromise = new Promise((resolve, reject) => {
        pendingMessageMap.set(requestId, { resolve, reject });
        worker?.postMessage({ typeId: 'cleanUp', payload, meta: { requestId } });
    });

    try {
        await cleanUpPromise;
    } catch (error) {
        console.debug('[monitor] cleanUp acknowledgement failed', error);
    } finally {
        forceTerminateWorker('Monitor worker cleaned up.');
    }
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function startWorker(): void {
    if (worker) return;

    worker = new Worker(new URL('@/workers/monitorWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { typeId, payload, meta } = event.data || {};
        if ((typeId === 'event:result' || typeId === 'event:error') && meta?.requestId !== undefined) {
            const pending = pendingMessageMap.get(meta.requestId);
            if (pending) {
                if (typeId === 'event:result') pending.resolve(payload);
                if (typeId === 'event:error') pending.reject(payload);
                pendingMessageMap.delete(meta.requestId);
            }
            return;
        }
        console.debug('FROM MONITOR WORKER', event.data);
    };
    worker.onerror = (event: ErrorEvent) => {
        console.error('WORKER ONERROR', event);
        forceTerminateWorker('Monitor worker crashed.');
    };
    worker.onmessageerror = (event: MessageEvent) => {
        console.error('WORKER ONMESSAGEERROR', event);
        forceTerminateWorker('Monitor worker message parsing error.');
    };

    // Must be run on main thread
    onCLS((metric) => logWebVitalMetric(metric));
    onINP((metric) => logWebVitalMetric(metric));
    onLCP((metric) => logWebVitalMetric(metric));
    onFCP((metric) => logWebVitalMetric(metric));
    onTTFB((metric) => logWebVitalMetric(metric));
}

function logWebVitalMetric(metric: Metric) {
    let entries;
    try {
        entries = metric.entries.map((entry) => entry.toJSON());
    } catch (error) {
        entries = [{ error: String(error) }];
    }
    const payload: WorkerMessageWebVitalPayload = {
        ...constructCommonPayload(),
        webVitalMetric: {
            id: metric.id,
            name: metric.name,
            value: metric.value,
            delta: metric.delta,
            entries,
            navigationType: metric.navigationType,
            rating: metric.rating
        }
    };
    worker?.postMessage({ typeId: 'logWebVitals', payload });
}

function constructCommonPayload(): WorkerMessagePayload {
    const anonId = localStorage.getItem('dpu_anon_user_id') || undefined;

    const navigatorWithConnection = navigator as NavigatorWithConnection;
    const connection = navigatorWithConnection.connection || navigatorWithConnection.mozConnection || navigatorWithConnection.webkitConnection;

    return {
        userId: activeUserId!,
        anonId,
        sessionId: '', // TODO
        browser: { language: globalThis.navigator.language },
        connection: {
            effectiveType: connection?.effectiveType,
            downlink: connection?.downlink,
            downlinkMax: connection?.downlinkMax,
            rtt: connection?.rtt,
            saveData: connection?.saveData,
            type: connection?.type
        },
        document: { referrer: globalThis.document.referrer },
        screen: { height: globalThis.screen.height, width: globalThis.screen.width },
        url: { href: globalThis.location.href, host: globalThis.location.host, pathname: globalThis.location.pathname },
        userAgent: globalThis.navigator.userAgent,
        viewport: { height: globalThis.window.innerHeight, width: globalThis.window.innerWidth }
    };
}

function forceTerminateWorker(reason: string) {
    if (!worker) return;
    rejectPendingRequests(reason);
    worker.terminate();
    worker = undefined;
}

function rejectPendingRequests(reason: string) {
    if (pendingMessageMap.size === 0) return;
    for (const pending of pendingMessageMap.values()) pending.reject(reason);
    pendingMessageMap.clear();
}
