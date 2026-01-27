/**
 * States messenger composable.
 *
 * See Chat GDP chat on need to keep websocket active https://chatgpt.com/c/69451b68-bdec-8332-99dd-e7657aef2a77
 */

import { markRaw } from 'vue';

// Framework dependencies.
import type { EngineConfig } from '@datapos/datapos-shared/engine';
import type { ModuleConfig } from '@datapos/datapos-shared/component';
import type { ToolConfig } from '@datapos/datapos-shared/component/tool';
import type { ConnectionConfig, ConnectorConfig } from '@datapos/datapos-shared/component/connector';
import type { ContextConfig, PresenterConfig } from '@datapos/datapos-shared';

import { useSessionStore } from '@/stores/sessionStore';

// Dependencies - Data.
import { version } from '@/../config.json';

/** Components */
// import DownloadIcon from '@/components/DPIcon/Download.vue';
// import RefreshIcon from '@/components/DPIcon/Refresh.vue';

/** Constants */
const DATAPOS_API_HOST = 'api.datapos.app';
const LOCAL_META_NODE_CONNECTOR_ID = 'datapos-connector-dexie-js';
const TIMEOUT_DELAY = 5000;

/** Non-Reactive Variables */
let localMetaNodeConnectorConfig: ConnectorConfig | undefined;
let webSocket: WebSocket | undefined;

/** Initialisation */
// const DownloadRawIcon = markRaw(DownloadIcon);
// const RefreshRawIcon = markRaw(RefreshIcon);

/** Composables */
export function useStatesMessenger() {
    // Operations - Connect to the 'States' WebSocket.
    function connect() {
        if (webSocket && (webSocket.readyState === WebSocket.CONNECTING || webSocket.readyState === WebSocket.OPEN)) return;
        webSocket = connectToStatesWebSocket();
    }

    // Operations - Disconnect from the 'States' WebSocket.
    function disconnect() {
        if (!webSocket) return;
        webSocket.close();
        webSocket = undefined;
    }

    // Utilities - Connect to the 'States' WebSocket.
    function connectToStatesWebSocket() {
        try {
            const wsURL = `wss://${DATAPOS_API_HOST}/states/websocket`;
            let statesWebSocket: WebSocket | undefined = new WebSocket(wsURL);

            statesWebSocket.onopen = () => {
                console.info('[datapos] ✅ App: WebSocket connection established.');
            };

            statesWebSocket.onmessage = (event) => {
                try {
                    const eventData = JSON.parse(event.data);
                    switch (eventData.typeId) {
                        case 'init':
                            return registerModules(eventData.modules as ModuleConfig[]);
                        case 'deploy':
                            registerModules([eventData.module as ModuleConfig]);
                            return;
                        case 'delete':
                            return unregisterModules([eventData.module as ModuleConfig]);
                    }
                } catch (error) {
                    console.info(`[datapos] ❌ App: Module registration error: ${error}`);
                }
            };

            statesWebSocket.onclose = (event) => {
                console.info(`[datapos] ⚠️ App: WebSocket close event '${event.code}' received.`);
                statesWebSocket = undefined;
                setTimeout(connectToStatesWebSocket, TIMEOUT_DELAY);
            };

            statesWebSocket.onerror = (error) => {
                // TODO: Try and reconnect a limited number of times. If no success then display message requesting refresh.
                console.info(`[datapos] ❌ App: WebSocket operational error: ${error}`);
            };

            return statesWebSocket;
        } catch (error) {
            // TODO: Try and recreate a limited number of times. If no success then display message requesting refresh.
            console.info(`[datapos] ❌ App: WebSocket creation error: ${error}`);
            return undefined;
        }
    }

    // Utilities - Register modules.
    function registerModules(moduleConfigs: ModuleConfig[]): void {
        const sessionState = useSessionStore();

        //     let connectorRegistered = false;
        //     let presenterRegistered = false;
        //     let toolRegistered = false;

        //     const connectorConfigs = [...(sessionState.connectorConfigs ?? [])];
        //     const presenterConfigs = [...(sessionState.presenterConfigs ?? [])];
        //     const toolConfigs = [...(sessionState.toolConfigs ?? [])];

        //     for (const moduleConfig of moduleConfigs) {
        //         // TODO: Only register if new added or new version. Can we import in parallel for efficiency?
        //         if (moduleConfig.typeId === 'app') {
        //             const newVersion = moduleConfig.version;
        //             if (compareVersionStrings(sessionState.lastDeployedVersion || version, newVersion) === -1) {
        //                 const toast = useToast();
        //                 sessionState.lastDeployedVersion = newVersion;
        //                 toast.add({
        //                     actions: [{ icon: RefreshRawIcon, label: 'Reload', color: 'neutral', size: 'md', variant: 'outline', onClick: () => reloadWorkbench() }],
        //                     color: 'info',
        //                     description: t('alert.newVersionAvailableNotes', { currentVersion: version }),
        //                     icon: DownloadRawIcon,
        //                     title: t('alert.newVersionAvailableMessage', { newVersion }),
        //                     type: 'background'
        //                 });
        //             }
        //         } else if (moduleConfig.typeId === 'engine') {
        //             sessionState.engineConfig = moduleConfig as EngineConfig;
        //             console.info(`[datapos] ℹ️ App: Engine '${moduleConfig.id}' v${moduleConfig.version} registered.`);
        //         } else if (moduleConfig.typeId === 'connector') {
        //             connectorRegistered = true;
        //             const index = connectorConfigs.findIndex((connectorConfig) => connectorConfig.id === moduleConfig.id);
        //             if (index === -1) {
        //                 connectorConfigs.push(moduleConfig as ConnectorConfig);
        //             } else {
        //                 connectorConfigs[index] = moduleConfig as ConnectorConfig;
        //             }
        //             console.info(`[datapos] ℹ️ App: Connector '${moduleConfig.id}' v${moduleConfig.version} registered.`);
        //         } else if (moduleConfig.typeId === 'context') {
        //             sessionState.contextConfig = moduleConfig as ContextConfig; // Trigger shallow reference change for context.
        //             console.info(`[datapos] ℹ️ App: Context '${moduleConfig.id}' v${moduleConfig.version} registered.`);
        //         } else if (moduleConfig.typeId === 'presenter') {
        //             presenterRegistered = true;
        //             const index = presenterConfigs.findIndex((presenterConfig) => presenterConfig.id === moduleConfig.id);
        //             if (index === -1) {
        //                 presenterConfigs.push(moduleConfig as PresenterConfig);
        //             } else {
        //                 presenterConfigs[index] = moduleConfig as PresenterConfig;
        //             }
        //             console.info(`[datapos] ℹ️ App: Presenter '${moduleConfig.id}' v${moduleConfig.version} registered.`);
        //         } else if (moduleConfig.typeId === 'tool') {
        //             toolRegistered = true;
        //             const index = toolConfigs.findIndex((toolConfig) => toolConfig.id === moduleConfig.id);
        //             if (index === -1) {
        //                 toolConfigs.push(moduleConfig as ToolConfig);
        //             } else {
        //                 toolConfigs[index] = moduleConfig as ToolConfig;
        //             }
        //             console.info(`[datapos] ℹ️ App: Tool '${moduleConfig.id}' v${moduleConfig.version} registered.`);
        //         }
        //     }

        //     if (connectorRegistered) {
        //         sessionState.connectorConfigs = [...connectorConfigs]; // Trigger shallow reference change for connectors.
        //         if (sessionState.connectorConfigs.length > 0) {
        //             localMetaNodeConnectorConfig = sessionState.connectorConfigs.find((connectorConfig) => connectorConfig.id === LOCAL_META_NODE_CONNECTOR_ID);
        //             if (localMetaNodeConnectorConfig) {
        //                 sessionState.localMetaNodeConnectionConfig = constructConnectionConfig(localMetaNodeConnectorConfig);
        //             }
        //             constructDefaultConnectionConfigs();
        //         }
        //     }

        //     if (presenterRegistered || !sessionState.presenterConfigs) sessionState.presenterConfigs = [...presenterConfigs]; // Trigger shallow reference change for presenters.

        //     if (toolRegistered || !sessionState.toolConfigs) sessionState.toolConfigs = [...toolConfigs]; // Trigger shallow reference change for tools.
    }

    // Utilities - Unregister modules.
    function unregisterModules(moduleConfigs: ModuleConfig[]): void {
        const sessionState = useSessionStore();
        //     if (sessionState.connectorConfigs) {
        //         for (const moduleConfig of moduleConfigs) {
        //             const index = sessionState.connectorConfigs.findIndex((connectorConfig) => connectorConfig.id === moduleConfig.id);
        //             if (index === -1) continue;
        //             sessionState.connectorConfigs.splice(index, 1);
        //         }
        //     }
    }

    // // Utilities - Module: Compare version strings.
    // function compareVersionStrings(left: string, right: string): number {
    //     const leftSegments = left.split('.').map(Number);
    //     const rightSegments = right.split('.').map(Number);
    //     for (let index = 0; index < Math.max(leftSegments.length, rightSegments.length); index++) {
    //         const leftSegment = leftSegments[index] || 0;
    //         const rightSegment = rightSegments[index] || 0;
    //         if (leftSegment > rightSegment) {
    //             return 1;
    //         }
    //         if (leftSegment < rightSegment) {
    //             return -1;
    //         }
    //     }
    //     return 0;
    // }

    // // Utilities - Module: Construct connection configuration.
    // function constructConnectionConfig(connectorConfig: ConnectorConfig): ConnectionConfig {
    //     return {
    //         id: connectorConfig.id,
    //         description: {},
    //         authorisation: {},
    //         connectorConfig,
    //         icon: connectorConfig.icon,
    //         iconDark: null,
    //         lastVerifiedAt: 0,
    //         lastUpdatedAt: null,
    //         label: connectorConfig.label,
    //         status: null,
    //         statusId: connectorConfig.statusId,
    //         typeId: 'connectorConnection'
    //     };
    // }

    // // Utilities -  Module: Construct default connection configurations.
    // function constructDefaultConnectionConfigs(): void {
    //     const sessionState = useSessionStore();
    //     const pendingConnectionConfigs: ConnectionConfig[] = [];
    //     for (const connectorConfig of sessionState.connectorConfigs!) {
    //         // if (connectorConfig.id === 'datapos-connector-file-store-emulator') {
    //         pendingConnectionConfigs.push(constructConnectionConfig(connectorConfig));
    //         // }
    //     }
    //     sessionState.connectionConfigs = pendingConnectionConfigs;
    // }

    // // Utilities - Module: Reload workbench.
    // function reloadWorkbench(): void {
    //     // Reload the workbench by appending a timestamp to the URL and forcing a reload of the page.
    //     const appURL = new URL(window.location.href);
    //     const params = appURL.searchParams;
    //     params.delete('reload-timestamp');
    //     params.set('reload-timestamp', String(new Date().getTime()));
    //     window.location.href = appURL.toString();
    // }

    return { connect, disconnect };
}
