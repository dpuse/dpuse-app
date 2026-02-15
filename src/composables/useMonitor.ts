// External dependencies
import 'posthog-js/dist/web-vitals';
import posthog, { type CaptureOptions, type Properties } from 'posthog-js/dist/module.no-external';

// DPU framework
import type { ConnectionConfig, ConnectorConfig } from '@datapos/datapos-shared/component/connector';
import type { EngineConfig } from '@datapos/datapos-shared/engine';
import type { ModuleConfig } from '@datapos/datapos-shared/component';
import type { ToolConfig } from '@datapos/datapos-shared/component/tool';
import type { ContextConfig, PresenterConfig } from '@datapos/datapos-shared';

// Workbench core
import { type Exception, pendingExceptions, useSessionStore } from '@/stores/sessionStore';

// Constants
const DPU_API_HOST = 'api.datapos.app';
const LOCAL_META_NODE_CONNECTOR_ID = 'datapos-connector-dexie-js';
const POSTHOG_DEFAULTS = '2025-11-30';
const POSTHOG_URL = 'https://eu.i.posthog.com';
const TIMEOUT_DELAY = 5000;

// Types
export interface Monitor {
    captureEvent: (name: string, properties: Properties, options: CaptureOptions) => void;
    identifyUser: (userId: string, authSessionId: string, emailAddress?: string) => void;
    logException: (exception: Exception) => void;
    resetUser: () => void;
    shutdown: () => void;
}

// Long-lived session-scoped module states WebSocket
let moduleStatesWebSocket: WebSocket | undefined;
let localMetaNodeConnectorConfig: ConnectorConfig | undefined;

// Composable
export function useMonitor(userId?: string, authSessionId?: string, emailAddress?: string): Monitor {
    posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_API_KEY, {
        api_host: POSTHOG_URL,
        defaults: POSTHOG_DEFAULTS,
        advanced_disable_flags: false,
        capture_pageview: 'history_change',
        disable_session_recording: true,
        disable_surveys: true,
        enable_recording_console_log: false,
        enable_heatmaps: false,
        person_profiles: 'identified_only'
    });

    if (userId != null && authSessionId != null) identifyUser(userId, authSessionId, emailAddress);

    for (const exception of pendingExceptions) logException(exception);
    pendingExceptions.length = 0;

    if (!(moduleStatesWebSocket && (moduleStatesWebSocket.readyState === WebSocket.CONNECTING || moduleStatesWebSocket.readyState === WebSocket.OPEN))) {
        moduleStatesWebSocket = connectToModuleStatesWebSocket();
    }

    return { captureEvent, identifyUser, logException, resetUser, shutdown };
}

// Composable operations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function identifyUser(userId: string, authSessionId: string, emailAddress?: string): void {
    posthog.register_for_session({ dpu_auth_session_id: authSessionId });
    posthog.identify(userId, { dpu_user_id: userId, dpu_email_address: emailAddress });
}

function resetUser(): void {
    posthog.unregister_for_session('dpu_auth_session_id');
    posthog.reset();
}

function captureEvent(name: string, properties: Properties, options: CaptureOptions): void {
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
    console.error(`[dpu] ❌ App: Error:`, exceptionError, exceptionProperties, result);
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
            console.info('[dpu] ✅ App: WebSocket connection established.');
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
                console.info(`[dpu] ❌ App: Module registration error: ${String(error)}`);
            }
        });

        statesWebSocket.addEventListener('close', (event) => {
            console.info(`[dpu] ⚠️ App: WebSocket close event '${event.code}' received.`);
            statesWebSocket = undefined;
            setTimeout(connectToModuleStatesWebSocket, TIMEOUT_DELAY);
        });

        statesWebSocket.addEventListener('error', (error) => {
            // TODO: Try and reconnect a limited number of times. If no success then display message requesting refresh.
            console.info(`[dpu] ❌ App: WebSocket operational error: ${String(error)}`);
        });

        return statesWebSocket;
    } catch (error) {
        // TODO: Try and recreate a limited number of times. If no success then display message requesting refresh.
        console.info(`[dpu] ❌ App: WebSocket creation error: ${String(error)}`);
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
                console.info(`[dpu] ℹ️ App: Workbench '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
            case 'engine': {
                sessionState.engineConfig = moduleConfig as EngineConfig;
                console.info(`[dpu] ℹ️ App: Engine '${moduleConfig.id}' v${moduleConfig.version} registered.`);

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
                console.info(`[dpu] ℹ️ App: Connector '${moduleConfig.id}' v${moduleConfig.version} registered.`);

                break;
            }
            case 'context': {
                sessionState.contextConfig = moduleConfig as ContextConfig; // Trigger shallow reference change for context.
                console.info(`[dpu] ℹ️ App: Context '${moduleConfig.id}' v${moduleConfig.version} registered.`);

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
                console.info(`[dpu] ℹ️ App: Presenter '${moduleConfig.id}' v${moduleConfig.version} registered.`);

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
                console.info(`[dpu] ℹ️ App: Tool '${moduleConfig.id}' v${moduleConfig.version} registered.`);

                break;
            }
        }
        if (connectorRegistered) {
            sessionState.connectorConfigs = [...connectorConfigs]; // Trigger shallow reference change for connectors.
            if (sessionState.connectorConfigs.length > 0) {
                localMetaNodeConnectorConfig = sessionState.connectorConfigs.find((connectorConfig) => connectorConfig.id === LOCAL_META_NODE_CONNECTOR_ID);
                if (localMetaNodeConnectorConfig) {
                    sessionState.localMetaNodeConnectionConfig = constructConnectionConfig(localMetaNodeConnectorConfig);
                }
                constructDefaultConnectionConfigs();
            }
        }

        if (presenterRegistered || !sessionState.presenterConfigs) sessionState.presenterConfigs = [...presenterConfigs]; // Trigger shallow reference change for presenters.

        if (toolRegistered || !sessionState.toolConfigs) sessionState.toolConfigs = [...toolConfigs]; // Trigger shallow reference change for tools.
    }
}

function unregisterModules(moduleConfigs: ModuleConfig[]): void {
    const sessionState = useSessionStore();
    for (const moduleConfig of moduleConfigs) {
        if (moduleConfig.typeId === 'connector') {
            const index = sessionState.connectorConfigs?.findIndex((connectorConfig) => connectorConfig.id === moduleConfig.id) ?? -1;
            if (index === -1) continue;
            sessionState.connectorConfigs?.splice(index, 1);
        }
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
