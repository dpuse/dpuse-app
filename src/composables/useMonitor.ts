// Vendor dependencies
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// Workbench core
import type { WorkerMessagePayload, WorkerMessageWebVitalPayload, WorkerResponse } from '@/workers/monitorWorker';

// Long-lived session-scoped user identifier
let activeUserId: string | undefined;

// Long-lived session-scoped monitor worker
let monitorWorker: Worker | undefined;

// Composable
export function useMonitor() {
    return { cleanUp, initialise, logException, logPageView, resetUser };
}

// Composable operations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initialise(userId: string): void {
    if (!monitorWorker) startMonitorWorker();
    activeUserId = userId;
    monitorWorker?.postMessage({ typeId: 'initialise', payload: constructCommonPayload() /* TODO: anon identifier */ });
}

function resetUser(userId: string): void {
    if (!monitorWorker) return;
    activeUserId = userId;
    monitorWorker?.postMessage({ typeId: 'resetUser', payload: constructCommonPayload() });
}

function logPageView(): void {
    if (!monitorWorker) return;
    monitorWorker?.postMessage({ typeId: 'logPageView', payload: constructCommonPayload() });
}

function logException(error?: unknown): void {
    if (!monitorWorker) return;
    monitorWorker?.postMessage({ typeId: 'logException', payload: { ...constructCommonPayload(), error } });
}

function cleanUp(): void {
    if (!monitorWorker) return;
    monitorWorker?.postMessage({ typeId: 'cleanUp' });
}

// Monitor worker management ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function startMonitorWorker(): void {
    if (monitorWorker) return;

    monitorWorker = new Worker(new URL('@/workers/monitorWorker.ts', import.meta.url), { type: 'module' });
    monitorWorker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        // const { typeId, payload, meta } = event.data || {};
        // if ((typeId === 'event:result' || typeId === 'event:error') && meta?.requestId !== undefined) {
        //     const pending = pendingMessageMap.get(meta.requestId);
        //     if (pending) {
        //         if (typeId === 'event:result') pending.resolve(payload);
        //         if (typeId === 'event:error') pending.reject(payload);
        //         pendingMessageMap.delete(meta.requestId);
        //     }
        //     return;
        // }
        console.debug('FROM MONITOR WORKER', event.data);
    });
    monitorWorker.addEventListener('error', (event: ErrorEvent) => {
        console.error('WORKER ONERROR', event);
        forceTerminateWorker('Monitor worker crashed.');
    });
    monitorWorker.addEventListener('messageerror', (event: MessageEvent) => {
        console.error('WORKER ONMESSAGEERROR', event);
        forceTerminateWorker('Monitor worker message parsing error.');
    });
    logWebVitalMetrics();
}

function forceTerminateWorker(reason: string) {
    if (!monitorWorker) return;
    // rejectPendingRequests(reason);
    monitorWorker.terminate();
    monitorWorker = undefined;
}

// function rejectPendingRequests(reason: string) {
//     if (pendingMessageMap.size === 0) return;
//     for (const pending of pendingMessageMap.values()) pending.reject(reason);
//     pendingMessageMap.clear();
// }

// Web vital metric logging ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function logWebVitalMetrics() {
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
    monitorWorker?.postMessage({ typeId: 'logWebVitals', payload });
}

// Common payload construction ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Custom type declarations for navigator with connection properties (connection properties are still experimental)
type NavigatorConnection = { effectiveType?: string; downlink?: number; downlinkMax?: number; rtt?: number; saveData?: boolean; type?: string };
interface NavigatorWithConnection extends Navigator {
    connection?: NavigatorConnection;
    mozConnection?: NavigatorConnection;
    webkitConnection?: NavigatorConnection;
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
