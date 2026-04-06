// DPUse Framework
import type { EngineConfig } from '@dpuse/dpuse-shared/engine';
import type { ModuleConfig } from '@dpuse/dpuse-shared/component';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/tool';
import type { ConnectionConfig, ConnectorConfig } from '@dpuse/dpuse-shared/component/connector';
import type { ContextConfig, PresenterConfig } from '@dpuse/dpuse-shared';

// App Core
import { useSessionStore } from '@/stores/sessionStore';

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DPU_API_HOST = 'api.dpuse.app';
const LOCAL_META_NODE_CONNECTOR_ID = 'dpuse-connector-dexie-js';
const TIMEOUT_DELAY = 5000;

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let localMetaNodeConnectorConfig: ConnectorConfig | undefined;
let webSocket: WebSocket | undefined;
let webSocketShutdown = false;

// Actions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function initialise(): void {
    if (!(webSocket && (webSocket.readyState === WebSocket.CONNECTING || webSocket.readyState === WebSocket.OPEN))) {
        webSocket = connectToWebSocket();
        window.addEventListener('beforeunload', () => shutdown());
    }
}

// WebSocket helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function connectToWebSocket(): WebSocket | undefined {
    try {
        const url = `wss://${DPU_API_HOST}/configs/websocket`;
        let pendingWebSocket: WebSocket | undefined = new WebSocket(url);

        pendingWebSocket.addEventListener('open', () => {
            if (import.meta.env.DEV) console.info('[dpuse:app] ✅ Configuration WebSocket connection established.');
        });

        pendingWebSocket.addEventListener('message', (event) => {
            try {
                const eventData = JSON.parse(event.data);
                switch (eventData.typeId) {
                    case 'init':
                        return registerConfigurations(eventData.modules);
                    case 'deploy':
                        return registerConfigurations([eventData.module]);
                    case 'delete':
                        return unregisterConfigurations([eventData.module]);
                }
            } catch (error) {
                if (import.meta.env.DEV) console.info(`[dpuse:app] ❌ Configuration registration error: ${String(error)}`, error);
            }
        });

        pendingWebSocket.addEventListener('close', (event) => {
            if (import.meta.env.DEV) console.info(`[dpuse:app] ⚠️ Configuration WebSocket close event '${event.code}' received.`);
            pendingWebSocket = undefined;
            if (!webSocketShutdown) setTimeout(connectToWebSocket, TIMEOUT_DELAY);
        });

        pendingWebSocket.addEventListener('error', (error) => {
            // TODO: Try and reconnect a limited number of times. If no success then display message requesting refresh.
            if (import.meta.env.DEV) console.info(`[dpuse:app] ❌ Configuration WebSocket operational error: ${String(error)}`, error);
        });

        return pendingWebSocket;
    } catch (error) {
        // TODO: Try and recreate a limited number of times. If no success then display message requesting refresh.
        if (import.meta.env.DEV) console.info(`[dpuse:app] ❌ Configuration WebSocket creation error: ${String(error)}`, error);
        return undefined;
    }
}

function shutdown(): void {
    webSocketShutdown = true;
    if (webSocket) {
        webSocket.close();
        webSocket = undefined;
    }
}

// Registration Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function registerConfigurations(moduleConfigs: ModuleConfig[]): void {
    const sessionStore = useSessionStore();

    let connectorRegistered = false;
    let presenterRegistered = false;
    let toolRegistered = false;
    const connectorConfigs = [...(sessionStore.connectorConfigs ?? [])];
    const presenterConfigs = [...(sessionStore.presenterConfigs ?? [])];
    const toolConfigs = [...(sessionStore.toolConfigs ?? [])];

    for (const moduleConfig of moduleConfigs) {
        // TODO: Only register if new added or new version. Can we import in parallel for efficiency?
        switch (moduleConfig.typeId) {
            case 'app': {
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Workbench '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
            case 'engine': {
                sessionStore.engineConfig = moduleConfig as EngineConfig;
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
                sessionStore.contextConfig = moduleConfig as ContextConfig; // Trigger shallow reference change for context.
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
        sessionStore.connectorConfigs = [...connectorConfigs];
        if (sessionStore.connectorConfigs.length > 0) {
            localMetaNodeConnectorConfig = sessionStore.connectorConfigs.find((connectorConfig) => connectorConfig.id === LOCAL_META_NODE_CONNECTOR_ID);
            if (localMetaNodeConnectorConfig) {
                sessionStore.localMetaStoreConnectionConfig = constructConnectionConfig(localMetaNodeConnectorConfig);
            }
            constructDefaultConnectionConfigs();
        }
    }

    if (presenterRegistered || !sessionStore.presenterConfigs) sessionStore.presenterConfigs = [...presenterConfigs];

    if (toolRegistered || !sessionStore.toolConfigs) sessionStore.toolConfigs = [...toolConfigs];
}

function unregisterConfigurations(moduleConfigs: ModuleConfig[]): void {
    const sessionStore = useSessionStore();
    const idsToRemove = new Set(moduleConfigs.filter((m) => m.typeId === 'connector').map((m) => m.id));
    if (idsToRemove.size > 0 && sessionStore.connectorConfigs) {
        sessionStore.connectorConfigs = sessionStore.connectorConfigs.filter((c) => !idsToRemove.has(c.id));
    }
}

// Connection Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
    const sessionStore = useSessionStore();
    const pendingConnectionConfigs: ConnectionConfig[] = [];
    for (const connectorConfig of sessionStore.connectorConfigs!) {
        // if (connectorConfig.id === 'dpuse-connector-file-store-emulator') {
        pendingConnectionConfigs.push(constructConnectionConfig(connectorConfig));
        // }
    }
    sessionStore.connectionConfigs = pendingConnectionConfigs;
}
