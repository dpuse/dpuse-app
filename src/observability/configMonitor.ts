// DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import type { ContextConfig } from '@dpuse/dpuse-shared/component/module/context';
import type { EngineConfig } from '@dpuse/dpuse-shared/component/module/engine';
import type { ModuleConfig } from '@dpuse/dpuse-shared/component/module';
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';

// Local (App) Framework
import { connectorConfigs, contextConfig, engineConfig, presenterConfigs, toolConfigs } from '@/state/session';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const DPU_API_HOST = 'api.dpuse.app';
const TIMEOUT_DELAY = 5000;

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

let webSocket: WebSocket | undefined;
let isWebSocketShutdown = false;

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialise(): void {
    if ((webSocket && (webSocket.readyState === WebSocket.CONNECTING || webSocket.readyState === WebSocket.OPEN))) {
    	return;
    }

    webSocket = connectToWebSocket();
    window.addEventListener('pagehide', () => shutdown());
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) {
        	return;
        }

        isWebSocketShutdown = false;
        webSocket = connectToWebSocket();
    });
}

// WebSocket helpers ───────────────────────────────────────────────────────────────────────────────────────────────────

function connectToWebSocket(): WebSocket | undefined {
    try {
        const url = `wss://${DPU_API_HOST}/configs/websocket`;
        let pendingWebSocket: WebSocket | undefined = new WebSocket(url);

        pendingWebSocket.addEventListener('open', () => {
            if (import.meta.env.DEV) console.info('[dpuse:app] ✅  Configuration WebSocket connection opened.');
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
                if (import.meta.env.DEV) console.info(`[dpuse:app] ❌  Configuration registration error: ${String(error)}`, error);
            }
        });

        pendingWebSocket.addEventListener('close', (event) => {
            if (import.meta.env.DEV) console.info(`[dpuse:app] ⚠️  Configuration WebSocket close event '${event.code}' received.`);
            pendingWebSocket = undefined;
            if (!isWebSocketShutdown) setTimeout(connectToWebSocket, TIMEOUT_DELAY);
        });

        pendingWebSocket.addEventListener('error', (error) => {
            // TODO: Try and reconnect a limited number of times. If no success then display message requesting refresh.
            if (import.meta.env.DEV) console.info(`[dpuse:app] ❌  Configuration WebSocket operational error: ${String(error)}`, error);
        });

        return pendingWebSocket;
    } catch (error) {
        // TODO: Try and recreate a limited number of times. If no success then display message requesting refresh.
        if (import.meta.env.DEV) console.info(`[dpuse:app] ❌  Configuration WebSocket creation error: ${String(error)}`, error);
        return undefined;
    }
}

function shutdown(): void {
    isWebSocketShutdown = true;
    if (webSocket) {
        webSocket.close();
        webSocket = undefined;
    }
}

// Registration Helpers ────────────────────────────────────────────────────────────────────────────────────────────────

function registerConfigurations(moduleConfigs: ModuleConfig[]): void {
    let isConnectorRegistered = false;
    let isPresenterRegistered = false;
    let isToolRegistered = false;
    const pendingConnectorConfigs = [...(connectorConfigs.value ?? [])];
    const pendingPresenterConfigs = [...(presenterConfigs.value ?? [])];
    const pendingToolConfigs = [...(toolConfigs.value ?? [])];

    for (const moduleConfig of moduleConfigs) {
        // TODO: Only register if new added or new version. Can we import in parallel for efficiency?
        switch (moduleConfig.typeId) {
            case 'app':
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️  Workbench '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            case 'engine':
                engineConfig.value = moduleConfig as EngineConfig;
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️  Engine '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            case 'connector': {
                isConnectorRegistered = true;
                const index = pendingConnectorConfigs.findIndex((connectorConfig) => connectorConfig.id === moduleConfig.id);
                if (index === -1) {
                    pendingConnectorConfigs.push(moduleConfig as ConnectorConfig);
                } else {
                    pendingConnectorConfigs[index] = moduleConfig as ConnectorConfig;
                }
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️  Connector '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
            case 'context':
                contextConfig.value = moduleConfig as ContextConfig; // Trigger shallow reference change for context.
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️  Context '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            case 'presenter': {
                isPresenterRegistered = true;
                const index = pendingPresenterConfigs.findIndex((presenterConfig) => presenterConfig.id === moduleConfig.id);
                if (index === -1) {
                    pendingPresenterConfigs.push(moduleConfig as PresenterConfig);
                } else {
                    pendingPresenterConfigs[index] = moduleConfig as PresenterConfig;
                }
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️  Presenter '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
            case 'tool': {
                isToolRegistered = true;
                const index = pendingToolConfigs.findIndex((toolConfig) => toolConfig.id === moduleConfig.id);
                if (index === -1) {
                    pendingToolConfigs.push(moduleConfig as ToolConfig);
                } else {
                    pendingToolConfigs[index] = moduleConfig as ToolConfig;
                }
                if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️  Tool '${moduleConfig.id}' v${moduleConfig.version} registered.`);
                break;
            }
        }
    }

    if (isConnectorRegistered) connectorConfigs.value = [...pendingConnectorConfigs];

    if (isPresenterRegistered) presenterConfigs.value = [...pendingPresenterConfigs];

    if (isToolRegistered) toolConfigs.value = [...pendingToolConfigs];
}

function unregisterConfigurations(moduleConfigs: ModuleConfig[]): void {
    const idsToRemove = new Set(moduleConfigs.filter((m) => m.typeId === 'connector').map((m) => m.id));
    if (idsToRemove.size > 0) {
        connectorConfigs.value = connectorConfigs.value.filter((c) => !idsToRemove.has(c.id));
    }
}

// Connection Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────

function constructConnectionConfig(connectorConfig: ConnectorConfig): ConnectionConfig {
    return {
        id: connectorConfig.id,
        description: {},
        authorisation: {},
        connectorConfig,
        firstCreatedAt: null,
        icon: connectorConfig.icon,
        iconDark: connectorConfig.iconDark,
        iconNeutral: connectorConfig.iconNeutral,
        lastVerifiedAt: 0,
        lastUpdatedAt: null,
        label: connectorConfig.label,
        notation: undefined,
        status: null,
        statusId: connectorConfig.statusId,
        typeId: 'connectorConnection'
    };
}
