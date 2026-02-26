// External dependencies
// import 'posthog-js/dist/web-vitals';
// import posthog, { type CaptureOptions, type Properties } from 'posthog-js/dist/module.no-external';
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// DPU framework
import type { DPUError } from '@datapos/datapos-shared/errors';
import type { EngineConfig } from '@datapos/datapos-shared/engine';
import type { ModuleConfig } from '@datapos/datapos-shared/component';
import type { ToolConfig } from '@datapos/datapos-shared/component/tool';
import type { ConnectionConfig, ConnectorConfig } from '@datapos/datapos-shared/component/connector';
import type { ContextConfig, PresenterConfig } from '@datapos/datapos-shared';

// App core
import { type Exception, pendingExceptions, useSessionStore } from '@/stores/sessionStore';

// Constants
const DPU_API_HOST = 'api.datapos.app';
const LOCAL_META_NODE_CONNECTOR_ID = 'datapos-connector-dexie-js';
// const POSTHOG_DEFAULTS = '2025-11-30';
// const POSTHOG_URL = 'https://eu.i.posthog.com';
const TIMEOUT_DELAY = 5000;

// Long-lived session-scoped module states WebSocket
let moduleStatesWebSocket: WebSocket | undefined;
let moduleStatesWebSocketShutdown = false;
let localMetaNodeConnectorConfig: ConnectorConfig | undefined;

// Tracked identity for event attribution
let activeSessionId = '';
let activeUserId = '';

// ???
export function logErrorToConsole(error: unknown): void {
    let message = '';
    let prefix = '';
    let cause = error;
    while (cause != null) {
        if (cause instanceof Error) {
            const stackOnly = cause.stack?.replace(/^.*\n/, '') ?? '';
            if ('locator' in cause) {
                const error_ = cause as DPUError;
                message += `${prefix}${error_.name}: ${error_.message}${error_.locator ? `\n    in ${error_.locator}` : ''}\n${stackOnly}\n`;
            } else {
                message += `${prefix}${cause.name}: ${cause.message}\n${stackOnly}\n`;
            }
        } else {
            message += `${prefix}${String(cause)}\n`;
        }
        prefix = 'Caused by: ';
        cause = cause instanceof Error ? cause.cause : undefined;
    }
    if (import.meta.env.DEV) console.info('[dpu:app] ❌', message);
}

type EventTypeId = 'error' | 'identify' | 'pageView' | 'reset' | 'webVital';
const pendingEvents: Record<string, unknown>[] = [];
function trackEvent(typeId: EventTypeId, data: Record<string, unknown>): void {
    pendingEvents.push({ typeId, asAt: Date.now(), sessionId: undefined, userId: undefined, spanId: undefined, ...data });
}
function trackWebVitalMetric(metric: Metric): void {
    trackEvent('webVital', {
        webVitalName: metric.name,
        webVitalDelta: metric.delta,
        webVitalNavigationType: metric.navigationType,
        webVitalRating: metric.rating,
        webVitalValue: metric.value
    });
}
async function flushEvents(): Promise<void> {
    if (pendingEvents.length === 0) return;
    // navigator.sendBeacon(`https://${DPU_API_HOST}/events`, JSON.stringify({ events: pendingEvents.splice(0), userAgentString: navigator.userAgent })); // Fails silently if browser cannot queue request
}
setInterval(flushEvents, 5000);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushEvents();
});

// Composable that encapsulates PostHog interface and module state websocket
export interface Monitor {
    // captureEvent: (name: string, properties: Properties, options: CaptureOptions) => void;
    identifyUser: (userId: string, sessionId: string, emailAddress?: string) => void;
    logException: (exception: Exception) => void;
    resetUser: () => void;
    shutdown: () => void;
}
export function useMonitor(userId?: string, sessionId?: string, emailAddress?: string): Monitor {
    // posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_API_KEY, {
    //     api_host: POSTHOG_URL,
    //     defaults: POSTHOG_DEFAULTS,
    //     advanced_disable_flags: false,
    //     capture_pageview: 'history_change',
    //     disable_session_recording: true,
    //     disable_surveys: true,
    //     enable_recording_console_log: false,
    //     enable_heatmaps: false,
    //     person_profiles: 'identified_only'
    // });

    onLCP(trackWebVitalMetric);
    onINP(trackWebVitalMetric);
    onCLS(trackWebVitalMetric);
    onFCP(trackWebVitalMetric);
    onTTFB(trackWebVitalMetric);

    if (userId != null && sessionId != null) identifyUser(userId, sessionId, emailAddress);

    for (const exception of pendingExceptions) logException(exception);
    pendingExceptions.length = 0;

    if (!(moduleStatesWebSocket && (moduleStatesWebSocket.readyState === WebSocket.CONNECTING || moduleStatesWebSocket.readyState === WebSocket.OPEN))) {
        moduleStatesWebSocket = connectToModuleStatesWebSocket();
    }

    return { /*captureEvent,*/ identifyUser, logException, resetUser, shutdown };
}

// PostHog helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function identifyUser(userId: string, sessionId: string, emailAddress?: string): void {
    void emailAddress;
    activeUserId = userId;
    activeSessionId = sessionId;
    // posthog.register_for_session({ dpu_auth_session_id: sessionId });
    // posthog.identify(userId, { dpu_user_id: userId, dpu_email_address: emailAddress });
}

function resetUser(): void {
    activeUserId = '';
    activeSessionId = '';
    // posthog.unregister_for_session('dpu_auth_session_id');
    // posthog.reset();
}

// function captureEvent(name: string, properties: Properties, options: CaptureOptions): void {
//     posthog.capture(name, properties, options);
// }

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
    // const result = posthog.captureException(exceptionError, exceptionProperties);
    if (import.meta.env.DEV) console.info('[dpu:app] ❌', exceptionError, exceptionProperties /*, result*/);
}

function shutdown(): void {
    moduleStatesWebSocketShutdown = true;
    flushEvents();
    if (moduleStatesWebSocket) {
        moduleStatesWebSocket.close();
        moduleStatesWebSocket = undefined;
    }
}

// Module states WebSocket helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function connectToModuleStatesWebSocket(): WebSocket | undefined {
    try {
        const wsURL = `wss://${DPU_API_HOST}/states/websocket`;
        let statesWebSocket: WebSocket | undefined = new WebSocket(wsURL);

        statesWebSocket.addEventListener('open', () => {
            if (import.meta.env.DEV) console.info('[dpu:app] ✅ WebSocket connection established.');
        });

        statesWebSocket.addEventListener('message', (event) => {
            try {
                const eventData = JSON.parse(event.data);
                switch (eventData.typeId) {
                    case 'init':
                        return registerModules(eventData.modules);
                    case 'deploy':
                        return registerModules([eventData.module]);
                    case 'delete':
                        return unregisterModules([eventData.module]);
                }
            } catch (error) {
                if (import.meta.env.DEV) console.info(`[dpu:app] ❌ Module registration error: ${String(error)}`, error);
            }
        });

        statesWebSocket.addEventListener('close', (event) => {
            if (import.meta.env.DEV) console.info(`[dpu:app] ⚠️ WebSocket close event '${event.code}' received.`);
            statesWebSocket = undefined;
            if (!moduleStatesWebSocketShutdown) setTimeout(connectToModuleStatesWebSocket, TIMEOUT_DELAY);
        });

        statesWebSocket.addEventListener('error', (error) => {
            // TODO: Try and reconnect a limited number of times. If no success then display message requesting refresh.
            if (import.meta.env.DEV) console.info(`[dpu:app] ❌ WebSocket operational error: ${String(error)}`, error);
        });

        return statesWebSocket;
    } catch (error) {
        // TODO: Try and recreate a limited number of times. If no success then display message requesting refresh.
        if (import.meta.env.DEV) console.info(`[dpu:app] ❌ WebSocket creation error: ${String(error)}`, error);
        return undefined;
    }
}

function registerModules(moduleConfigs: ModuleConfig[]): void {
    const sessionState = useSessionStore();

    let connectorRegistered = false;
    let presenterRegistered = false;
    let toolRegistered = false;
    const connectorConfigs = [...(sessionState.connectorConfigs ?? [])];
    const presenterConfigs = [...(sessionState.presenterConfigs ?? [])];
    const toolConfigs = [...(sessionState.toolConfigs ?? [])];

    for (const moduleConfig of moduleConfigs) {
        // TODO: Only register if new added or new version. Can we import in parallel for efficiency?
        switch (moduleConfig.typeId) {
            case 'app': {
                if (import.meta.env.DEV) console.info(`[dpu:app] ℹ️ Workbench '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
            case 'engine': {
                sessionState.engineConfig = moduleConfig as EngineConfig;
                if (import.meta.env.DEV) console.info(`[dpu:app] ℹ️ Engine '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
            case 'connector': {
                connectorRegistered = true;
                const index = connectorConfigs.findIndex((connectorConfig) => connectorConfig.id === moduleConfig.id);
                if (index === -1) {
                    connectorConfigs.push(moduleConfig as ConnectorConfig);
                } else {
                    connectorConfigs[index] = moduleConfig as ConnectorConfig;
                }
                if (import.meta.env.DEV) console.info(`[dpu:app] ℹ️ Connector '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
            case 'context': {
                sessionState.contextConfig = moduleConfig as ContextConfig; // Trigger shallow reference change for context.
                if (import.meta.env.DEV) console.info(`[dpu:app] ℹ️ Context '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
            case 'presenter': {
                presenterRegistered = true;
                const index = presenterConfigs.findIndex((presenterConfig) => presenterConfig.id === moduleConfig.id);
                if (index === -1) {
                    presenterConfigs.push(moduleConfig as PresenterConfig);
                } else {
                    presenterConfigs[index] = moduleConfig as PresenterConfig;
                }
                if (import.meta.env.DEV) console.info(`[dpu:app] ℹ️ Presenter '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
            case 'tool': {
                toolRegistered = true;
                const index = toolConfigs.findIndex((toolConfig) => toolConfig.id === moduleConfig.id);
                if (index === -1) {
                    toolConfigs.push(moduleConfig as ToolConfig);
                } else {
                    toolConfigs[index] = moduleConfig as ToolConfig;
                }
                if (import.meta.env.DEV) console.info(`[dpu:app] ℹ️ Tool '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
        }
    }

    if (connectorRegistered) {
        sessionState.connectorConfigs = [...connectorConfigs];
        if (sessionState.connectorConfigs.length > 0) {
            localMetaNodeConnectorConfig = sessionState.connectorConfigs.find((connectorConfig) => connectorConfig.id === LOCAL_META_NODE_CONNECTOR_ID);
            if (localMetaNodeConnectorConfig) {
                sessionState.localMetaStoreConnectionConfig = constructConnectionConfig(localMetaNodeConnectorConfig);
            }
            constructDefaultConnectionConfigs();
        }
    }

    if (presenterRegistered || !sessionState.presenterConfigs) sessionState.presenterConfigs = [...presenterConfigs];

    if (toolRegistered || !sessionState.toolConfigs) sessionState.toolConfigs = [...toolConfigs];
}

function unregisterModules(moduleConfigs: ModuleConfig[]): void {
    const sessionState = useSessionStore();
    const idsToRemove = new Set(moduleConfigs.filter((m) => m.typeId === 'connector').map((m) => m.id));
    if (idsToRemove.size > 0 && sessionState.connectorConfigs) {
        sessionState.connectorConfigs = sessionState.connectorConfigs.filter((c) => !idsToRemove.has(c.id));
    }
}

function constructConnectionConfig(connectorConfig: ConnectorConfig): ConnectionConfig {
    return {
        id: connectorConfig.id,
        description: {},
        authorisation: {},
        connectorConfig,
        icon: connectorConfig.icon,
        iconDark: null,
        lastVerifiedAt: 0,
        lastUpdatedAt: null,
        label: connectorConfig.label,
        notation: undefined,
        status: null,
        statusId: connectorConfig.statusId,
        typeId: 'connectorConnection'
    };
}

function constructDefaultConnectionConfigs(): void {
    const sessionState = useSessionStore();
    const pendingConnectionConfigs: ConnectionConfig[] = [];
    for (const connectorConfig of sessionState.connectorConfigs!) {
        // if (connectorConfig.id === 'datapos-connector-file-store-emulator') {
        pendingConnectionConfigs.push(constructConnectionConfig(connectorConfig));
        // }
    }
    sessionState.connectionConfigs = pendingConnectionConfigs;
}
