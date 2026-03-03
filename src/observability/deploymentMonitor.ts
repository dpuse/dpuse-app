// DPUse Framework
import type { EngineConfig } from '@datapos/datapos-shared/engine';
import type { ModuleConfig } from '@datapos/datapos-shared/component';
import type { ToolConfig } from '@datapos/datapos-shared/component/tool';
import type { ConnectionConfig, ConnectorConfig } from '@datapos/datapos-shared/component/connector';
import type { ContextConfig, PresenterConfig } from '@datapos/datapos-shared';

// App Core
import { useSessionStore } from '@/stores/sessionStore';

// Constants
const DPU_API_HOST = 'api.datapos.app';
const LOCAL_META_NODE_CONNECTOR_ID = 'datapos-connector-dexie-js';
const TIMEOUT_DELAY = 5000;

// Long-lived session-scoped module states WebSocket
let moduleStatesWebSocket: WebSocket | undefined;
let moduleStatesWebSocketShutdown = false;
let localMetaNodeConnectorConfig: ConnectorConfig | undefined;

// Functions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function initialise(): void {
    if (!(moduleStatesWebSocket && (moduleStatesWebSocket.readyState === WebSocket.CONNECTING || moduleStatesWebSocket.readyState === WebSocket.OPEN))) {
        moduleStatesWebSocket = connectToModuleStatesWebSocket();
        window.addEventListener('beforeunload', () => shutdown());
    }
}

// WebSocket helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function connectToModuleStatesWebSocket(): WebSocket | undefined {
    try {
        const wsURL = `wss://${DPU_API_HOST}/states/websocket`;
        let statesWebSocket: WebSocket | undefined = new WebSocket(wsURL);

        statesWebSocket.addEventListener('open', () => {
            if (import.meta.env.DEV) console.info('[dpuse:app] ✅ WebSocket connection established.');
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
                if (import.meta.env.DEV) console.info(`[dpuse:app] ❌ Module registration error: ${String(error)}`, error);
            }
        });

        statesWebSocket.addEventListener('close', (event) => {
            if (import.meta.env.DEV) console.info(`[dpuse:app] ⚠️ WebSocket close event '${event.code}' received.`);
            statesWebSocket = undefined;
            if (!moduleStatesWebSocketShutdown) setTimeout(connectToModuleStatesWebSocket, TIMEOUT_DELAY);
        });

        statesWebSocket.addEventListener('error', (error) => {
            // TODO: Try and reconnect a limited number of times. If no success then display message requesting refresh.
            if (import.meta.env.DEV) console.info(`[dpuse:app] ❌ WebSocket operational error: ${String(error)}`, error);
        });

        return statesWebSocket;
    } catch (error) {
        // TODO: Try and recreate a limited number of times. If no success then display message requesting refresh.
        if (import.meta.env.DEV) console.info(`[dpuse:app] ❌ WebSocket creation error: ${String(error)}`, error);
        return undefined;
    }
}

function shutdown(): void {
    moduleStatesWebSocketShutdown = true;
    if (moduleStatesWebSocket) {
        moduleStatesWebSocket.close();
        moduleStatesWebSocket = undefined;
    }
}

// Module helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Workbench '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
            case 'engine': {
                sessionState.engineConfig = moduleConfig as EngineConfig;
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Engine '${moduleConfig.id}' v${moduleConfig.version} registered.`);
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
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Connector '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
            case 'context': {
                sessionState.contextConfig = moduleConfig as ContextConfig; // Trigger shallow reference change for context.
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Context '${moduleConfig.id}' v${moduleConfig.version} registered.`);
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
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Presenter '${moduleConfig.id}' v${moduleConfig.version} registered.`);
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
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Tool '${moduleConfig.id}' v${moduleConfig.version} registered.`);
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

// Connection configuration helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
