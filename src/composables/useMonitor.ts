// Vendor dependencies
import posthog from 'posthog-js/dist/module.no-external';
// import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// // Application framework
// import { serialiseError } from '@datapos/datapos-shared/errors';

// Workbench core
import { pendingExceptions } from '@/stores/sessionStore';
// import type { WorkerMessagePayload, WorkerMessageWebVitalPayload, WorkerResponse } from '@/workers/monitorWorker';

// Constants
const DPU_API_HOST = 'api.datapos.app';
const TIMEOUT_DELAY = 5000;

// Long-lived module-scoped monitor worker
// let monitorWorker: Worker | undefined;

// Long-lived session-scoped user identifier, initialised by 'initialise' operation, updated by 'resetUser' operation
let activeAuthUserId: string | undefined;

// Long-lived session-scoped identifier, initialised by 'initialise' operation, updated by 'resetUser' operation
let activeAuthSessionId: string | undefined;

// Long-lived session-scoped module states WebSocket
let moduleStatesWebSocket: WebSocket | undefined;

// Composable
export function useMonitor() {
    posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_API_KEY, { api_host: 'https://eu.i.posthog.com', defaults: '2025-11-30' });
    return { initialise, logException, logPageView, resetUser, shutdown };
}

// Composable operations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initialise(userId: string, authSessionId: string): void {
    // if (!monitorWorker) startMonitorWorker();
    activeAuthUserId = userId;
    activeAuthSessionId = authSessionId;

    if (moduleStatesWebSocket && (moduleStatesWebSocket.readyState === WebSocket.CONNECTING || moduleStatesWebSocket.readyState === WebSocket.OPEN)) return;
    moduleStatesWebSocket = connectToModuleStatesWebSocket();

    for (const exception of pendingExceptions) logException(exception);
    pendingExceptions.length = 0;

    // monitorWorker?.postMessage({ typeId: 'initialise', payload: constructCommonPayload() /* TODO: anon identifier */ });
    posthog.identify(activeAuthUserId);
}

function resetUser(): void {
    // if (!monitorWorker) return;

    activeAuthUserId = undefined;
    activeAuthSessionId = undefined;
    // monitorWorker?.postMessage({ typeId: 'resetUser', payload: constructCommonPayload() });
    posthog.reset();
}

// function resetSession(sessionId: string): void {
//     // if (!monitorWorker) return;

//     activeAuthSessionId = sessionId;
// }

function logPageView(): void {
    // if (!monitorWorker) return;
    // monitorWorker?.postMessage({ typeId: 'logPageView', payload: constructCommonPayload() });
}

function logException(error?: unknown): void {
    // if (!monitorWorker) return;

    const result = posthog.captureException(error, { activeAuthSessionId });
    console.log('CAPTURE RESULT', result);
    // const serialisedErrors = serialiseError(exception?.error ?? exception?.message ?? 'Unknown error');
    // console.log('serialisedErrors', serialisedErrors);
    // monitorWorker?.postMessage({ typeId: 'logException', payload: { ...constructCommonPayload(), serialisedErrors } });
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

function connectToModuleStatesWebSocket(): WebSocket | undefined {
    try {
        const wsURL = `wss://${DPU_API_HOST}/states/websocket`;
        let statesWebSocket: WebSocket | undefined = new WebSocket(wsURL);

        statesWebSocket.addEventListener('open', () => {
            console.info('[datapos] ✅ App: WebSocket connection established.');
        });

        statesWebSocket.addEventListener('message', (event) => {
            try {
                const eventData = JSON.parse(event.data);
                switch (eventData.typeId) {
                    case 'init':
                        return self.postMessage({ typeId: 'modulesRegistered', payload: eventData.modules });
                    case 'deploy':
                        return self.postMessage({ typeId: 'modulesRegistered', payload: [eventData.module] });
                    case 'delete':
                        return self.postMessage({ typeId: 'modulesUnregistered', payload: [eventData.module] });
                }
            } catch (error) {
                console.info(`[datapos] ❌ App: Module registration error: ${error}`);
            }
        });

        statesWebSocket.addEventListener('close', (event) => {
            console.info(`[datapos] ⚠️ App: WebSocket close event '${event.code}' received.`);
            statesWebSocket = undefined;
            setTimeout(connectToModuleStatesWebSocket, TIMEOUT_DELAY);
        });

        statesWebSocket.addEventListener('error', (error) => {
            // TODO: Try and reconnect a limited number of times. If no success then display message requesting refresh.
            console.info(`[datapos] ❌ App: WebSocket operational error: ${error}`);
        });

        return statesWebSocket;
    } catch (error) {
        // TODO: Try and recreate a limited number of times. If no success then display message requesting refresh.
        console.info(`[datapos] ❌ App: WebSocket creation error: ${error}`);
        return undefined;
    }
}

function shutdown(): void {
    // if (!monitorWorker) return;
    // monitorWorker?.postMessage({ typeId: 'shutdown' });
    if (moduleStatesWebSocket) {
        moduleStatesWebSocket.close(); // TODO: Won't this just open again? Maybe check event.code?
        moduleStatesWebSocket = undefined;
    }
}

// Monitor worker management ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// function startMonitorWorker(): void {
//     if (monitorWorker) return;

//     monitorWorker = new Worker(new URL('@/workers/monitorWorker.ts', import.meta.url), { type: 'module' });

//     // Response (outbound) message listener
//     monitorWorker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
//         const { typeId, payload } = event.data;
//         switch (typeId) {
//             case 'modulesRegistered':
//                 console.log('MODULES REGISTERED', payload);
//                 break;
//             case 'modulesUnregistered':
//                 console.log('MODULES UNREGISTERED', payload);
//                 break;
//             case 'shutdownComplete':
//                 break;
//         }
//     });

//     monitorWorker.addEventListener('error', (event: ErrorEvent) => {
//         console.error('WORKER ONERROR', event);
//         shutdownWorker();
//     });

//     monitorWorker.addEventListener('messageerror', (event: MessageEvent) => {
//         console.error('WORKER ONMESSAGEERROR', event);
//         shutdownWorker();
//     });

//     logWebVitalMetrics();
// }

// function shutdownWorker() {
//     if (!monitorWorker) return;
//     monitorWorker.terminate();
//     monitorWorker = undefined;
// }

// Web vital metrics logging ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// function logWebVitalMetrics() {
//     // The following callbacks must run on main thread
//     // onCLS((metric) => logWebVitalMetric(metric));
//     // onINP((metric) => logWebVitalMetric(metric));
//     // onLCP((metric) => logWebVitalMetric(metric));
//     // onFCP((metric) => logWebVitalMetric(metric));
//     // onTTFB((metric) => logWebVitalMetric(metric));
// }

// function logWebVitalMetric(metric: Metric) {
//     const payload: WorkerMessageWebVitalPayload = {
//         ...constructCommonPayload(),
//         webVitalMetric: {
//             id: metric.id,
//             name: metric.name,
//             value: metric.value,
//             delta: metric.delta,
//             navigationType: metric.navigationType,
//             rating: metric.rating
//         }
//     };
//     monitorWorker?.postMessage({ typeId: 'logWebVitals', payload });
// }

// Common payload construction ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// // Custom type declarations for navigator with connection properties (connection properties are still experimental)
// type NavigatorConnection = { effectiveType?: string; downlink?: number; downlinkMax?: number; rtt?: number; saveData?: boolean; type?: string };
// interface NavigatorWithConnection extends Navigator {
//     connection?: NavigatorConnection;
//     mozConnection?: NavigatorConnection;
//     webkitConnection?: NavigatorConnection;
// }

// function constructCommonPayload(): WorkerMessagePayload {
//     // const anonId = localStorage.getItem('dpu_anon_user_id') || undefined;
//     const navigatorWithConnection = navigator as NavigatorWithConnection;
//     const connection = navigatorWithConnection.connection || navigatorWithConnection.mozConnection || navigatorWithConnection.webkitConnection;
//     return {
//         userId: activeUserId!,
//         // anonId,
//         sessionId: activeSessionId!,
//         browser: { language: globalThis.navigator.language },
//         connection: {
//             effectiveType: connection?.effectiveType,
//             downlink: connection?.downlink,
//             downlinkMax: connection?.downlinkMax,
//             rtt: connection?.rtt,
//             saveData: connection?.saveData,
//             type: connection?.type
//         },
//         document: { referrer: globalThis.document.referrer },
//         screen: { height: globalThis.screen.height, width: globalThis.screen.width },
//         url: { href: globalThis.location.href, host: globalThis.location.host, pathname: globalThis.location.pathname },
//         userAgent: globalThis.navigator.userAgent,
//         viewport: { height: globalThis.window.innerHeight, width: globalThis.window.innerWidth }
//     };
// }
