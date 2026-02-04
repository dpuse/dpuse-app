// Vendor dependencies
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// Application framework
// import { normalizeToError, VueHandledError, WindowHandledPromiseRejectionError, WindowHandledRuntimeError } from '@datapos/datapos-shared/errors';

// Workbench core
import type { WorkerMessagePayload, WorkerMessageWebVitalPayload, WorkerResponse } from '@/workers/monitorWorker';

export type Exception = { typeId: ErrorTypeId; payload: ErrorEvent | PromiseRejectionEvent | VueErrorContext };
type ErrorTypeId = 'app' | 'promise' | 'runtime' | 'vue';
type VueErrorContext = { error: unknown; info: string };

// Long-lived module-scoped monitor worker
let monitorWorker: Worker | undefined;

// Long-lived session-scoped user identifier, initialised by 'initialise' operation, updated by 'resetUser' operation
let activeUserId: string | undefined;

// Long-lived session-scoped identifier, initialised by 'initialise' operation, updated by 'resetUser' operation
let activeSessionId: string | undefined;

// Composable
export function useMonitor() {
    return { initialise, logException, logPageView, resetSession, resetUser, shutdown };
}

// Composable operations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initialise(userId: string, sessionId: string): void {
    if (!monitorWorker) startMonitorWorker();
    activeUserId = userId;
    activeSessionId = sessionId;
    monitorWorker?.postMessage({ typeId: 'initialise', payload: constructCommonPayload() /* TODO: anon identifier */ });
}

function resetUser(userId: string, sessionId: string): void {
    if (!monitorWorker) return;
    activeUserId = userId;
    activeSessionId = sessionId;
    monitorWorker?.postMessage({ typeId: 'resetUser', payload: constructCommonPayload() });
}

function resetSession(sessionId: string): void {
    if (!monitorWorker) return;
    activeSessionId = sessionId;
}

function logPageView(): void {
    if (!monitorWorker) return;
    monitorWorker?.postMessage({ typeId: 'logPageView', payload: constructCommonPayload() });
}

function logException(exception: Exception): void {
    if (!monitorWorker) return;
    // TODO: Normalise exception...
    const normalisedException = exception;
    monitorWorker?.postMessage({ typeId: 'logException', payload: { ...constructCommonPayload(), normalisedException } });
}

// function reportVueError(unhandledError: unknown, vm: ComponentPublicInstance | null, info: string): void {
//     try {
//         const normalisedError = normalizeToError(unhandledError ?? 'Unknown error.');
//         const message = 'Unhandled runtime error intercepted by global Vue error handler.';
//         reportErrorPlaceholder(new VueHandledError(message, 'workbench.reportVueError', info, vm?.$options?.name, { cause: normalisedError }), true, ['Unhandled']);
//     } catch (error) {
//         reportErrorSafely(error);
//     }
// }

// function reportWindowError(event: ErrorEvent): void {
//     try {
//         const normalisedError = normalizeToError(event?.error ?? event?.message ?? 'Unknown error.');
//         // if (normalisedError.message.includes('ResizeObserver loop ')) return; // Ignore this benign warning
//         const message = 'Unhandled runtime error intercepted by global Window error handler.';
//         reportErrorPlaceholder(new WindowHandledRuntimeError(message, 'workbench.reportWindowError', { cause: normalisedError }), true, ['Unhandled']);
//     } catch (error) {
//         reportErrorSafely(error);
//     }
// }

// function reportWindowUnhandledRejection(event: PromiseRejectionEvent): void {
//     try {
//         const normalisedError = normalizeToError(event?.reason ?? 'Unknown promise rejection reason.');
//         // if (normalisedError.message.includes('ResizeObserver loop ')) return; // Ignore this benign warning
//         const message = 'Unhandled promise rejection intercepted by global Window error handler.';
//         reportErrorPlaceholder(new WindowHandledPromiseRejectionError(message, 'workbench.reportWindowUnhandledRejection', { cause: normalisedError }), true, ['Unhandled']);
//     } catch (error) {
//         reportErrorSafely(error);
//     }
// }

function shutdown(): void {
    if (!monitorWorker) return;
    monitorWorker?.postMessage({ typeId: 'shutdown' });
}

// Monitor worker management ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function startMonitorWorker(): void {
    if (monitorWorker) return;

    monitorWorker = new Worker(new URL('@/workers/monitorWorker.ts', import.meta.url), { type: 'module' });

    // Response (outbound) message listener
    monitorWorker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        const { typeId, payload } = event.data;
        switch (typeId) {
            case 'modulesRegistered':
                console.log('MODULES REGISTERED', payload);
                break;
            case 'modulesUnregistered':
                console.log('MODULES UNREGISTERED', payload);
                break;
            case 'shutdownComplete':
                break;
        }
    });

    monitorWorker.addEventListener('error', (event: ErrorEvent) => {
        console.error('WORKER ONERROR', event);
        shutdownWorker();
    });

    monitorWorker.addEventListener('messageerror', (event: MessageEvent) => {
        console.error('WORKER ONMESSAGEERROR', event);
        shutdownWorker();
    });

    logWebVitalMetrics();
}

function shutdownWorker() {
    if (!monitorWorker) return;
    monitorWorker.terminate();
    monitorWorker = undefined;
}

// Web vital metrics logging ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function logWebVitalMetrics() {
    // The following callbacks must run on main thread
    onCLS((metric) => logWebVitalMetric(metric));
    onINP((metric) => logWebVitalMetric(metric));
    onLCP((metric) => logWebVitalMetric(metric));
    onFCP((metric) => logWebVitalMetric(metric));
    onTTFB((metric) => logWebVitalMetric(metric));
}

function logWebVitalMetric(metric: Metric) {
    const payload: WorkerMessageWebVitalPayload = {
        ...constructCommonPayload(),
        webVitalMetric: {
            id: metric.id,
            name: metric.name,
            value: metric.value,
            delta: metric.delta,
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
    // const anonId = localStorage.getItem('dpu_anon_user_id') || undefined;
    const navigatorWithConnection = navigator as NavigatorWithConnection;
    const connection = navigatorWithConnection.connection || navigatorWithConnection.mozConnection || navigatorWithConnection.webkitConnection;
    return {
        userId: activeUserId!,
        // anonId,
        sessionId: activeSessionId!,
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
