// Vendor dependencies
import posthog, { type CaptureOptions, type Properties } from 'posthog-js/dist/module.no-external';

// Workbench core
import { type Exception, pendingExceptions } from '@/stores/sessionStore';

// Constants
const DPU_API_HOST = 'api.datapos.app';
const POSTHOG_DEFAULTS = '2025-11-30';
const POSTHOG_URL = 'https://eu.i.posthog.com';
const TIMEOUT_DELAY = 5000;

// Long-lived session-scoped module states WebSocket
let moduleStatesWebSocket: WebSocket | undefined;

// Composable
export function useMonitor(userId?: string, authSessionId?: string, emailAddress?: string) {
    posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_API_KEY, { api_host: POSTHOG_URL, defaults: POSTHOG_DEFAULTS });

    if (userId && authSessionId) identifyUser(userId, authSessionId, emailAddress);

    for (const exception of pendingExceptions) logException(exception);
    pendingExceptions.length = 0;

    if (moduleStatesWebSocket && (moduleStatesWebSocket.readyState === WebSocket.CONNECTING || moduleStatesWebSocket.readyState === WebSocket.OPEN)) return;
    moduleStatesWebSocket = connectToModuleStatesWebSocket();
    return { captureEvent, identifyUser, logException, resetUser, shutdown };
}

// Composable operations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function identifyUser(userId: string, authSessionId: string, emailAddress?: string): void {
    posthog.register_for_session({ dpu_auth_session_id: authSessionId });
    console.log('dddd', userId, authSessionId, emailAddress, { dpu_user_id: userId, dpu_email_address: emailAddress });
    posthog.identify(userId, { dpu_user_id: userId, dpu_email_address: emailAddress });
}

function resetUser(): void {
    posthog.unregister_for_session('dpu_auth_session_id');
    posthog.reset();
}

function captureEvent(name: string, properties: Properties, options: CaptureOptions) {
    posthog.capture(name, properties, options);
}

function logException(exception: Exception): void {
    let exceptionError;
    let exceptionProperties;
    switch (exception.typeId) {
        case 'unhandledVue': {
            const payload = exception.payload;
            exceptionError = payload.error instanceof Error ? payload.error : new Error('Unknown Vue error.');
            const options = payload.instance?.$options ?? {};
            exceptionProperties = {
                dpu_exception_type_id: exception.typeId,
                dpu_exception_component_name: options.__name,
                dpu_exception_info: payload.info
            };
            break;
        }
        case 'unhandledRuntime': {
            const payload = exception.payload;
            exceptionError = payload.error instanceof Error ? payload.error : new Error(payload.message || 'Unknown runtime error.');
            exceptionProperties = {
                dpu_exception_type_id: 'runtime',
                dpu_exception_source_filename: payload.filename,
                dpu_exception_source_lineno: payload.lineno,
                dpu_exception_source_colno: payload.colno,
                dpu_exception_original_message: payload.message,
                dpu_exception_has_native_error: payload.error instanceof Error
            };
            break;
        }
        case 'unhandledPromise': {
            const payload = exception.payload;
            exceptionError = payload.reason instanceof Error ? payload.reason : new Error(`Unhandled promise rejection - ${String(payload.reason)}.`);
            exceptionProperties = {
                dpu_exception_type_id: exception.typeId,
                dpu_exception_reason: payload.reason
            };
            break;
        }
        default: {
            const payload = exception.payload;
            exceptionError = payload.error instanceof Error ? payload.error : new Error('Unknown handled error.');
            exceptionProperties = {
                dpu_exception_type_id: exception.typeId,
                dpu_exception_locator: payload.locator
            };
            break;
        }
    }
    const result = posthog.captureException(exceptionError, exceptionProperties);
    console.log('EXCEPTION', result);
}

function shutdown(): void {
    if (moduleStatesWebSocket) {
        moduleStatesWebSocket.close(); // TODO: Won't this just open again? Maybe check event.code?
        moduleStatesWebSocket = undefined;
    }
}

// Module states WebSocket helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
