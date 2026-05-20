// Local (App) Framework
import { accountId, type ConnectionAccountConfig, connectionAccountConfigs } from '@/state/session';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const DPU_API_HOST = 'api.dpuse.app';
const TIMEOUT_DELAY = 5000;

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

let webSocket: WebSocket | undefined;
let webSocketShutdown = false;

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialise(): void {
    if (!(webSocket && (webSocket.readyState === WebSocket.CONNECTING || webSocket.readyState === WebSocket.OPEN))) {
        webSocketShutdown = false;
        webSocket = connectToWebSocket();
        window.addEventListener('pagehide', () => shutdown());
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                webSocketShutdown = false;
                webSocket = connectToWebSocket();
            }
        });
    }
}

export function terminate(): void {
    shutdown();
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function connectToWebSocket(): WebSocket | undefined {
    try {
        const url = `wss://${DPU_API_HOST}/accounts/${accountId.value}/websocket`;
        let pendingWebSocket: WebSocket | undefined = new WebSocket(url);

        pendingWebSocket.addEventListener('open', () => {
            // TODO: I think this is where the data is being cleared?
            if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ✅ Accounts '${accountId.value}' WebSocket connection established.`);
        });

        pendingWebSocket.addEventListener('message', (event) => {
            try {
                const eventData = JSON.parse(event.data);
                const configs: ConnectionAccountConfig[] = [];
                for (const connection of eventData.config.connections) {
                    configs.push({ connectorId: connection.connectorId });
                }
                connectionAccountConfigs.value = configs;
            } catch (error) {
                if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ❌ Account configuration retrieval error: ${String(error)}`, error);
            }
        });

        pendingWebSocket.addEventListener('close', (event) => {
            if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ⚠️ Accounts WebSocket close event '${event.code}' received.`);
            pendingWebSocket = undefined;
            if (!webSocketShutdown) setTimeout(connectToWebSocket, TIMEOUT_DELAY);
        });

        pendingWebSocket.addEventListener('error', (error) => {
            // TODO: Try and reconnect a limited number of times. If no success then display message requesting refresh.
            if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ❌ Accounts WebSocket operational error: ${String(error)}`, error);
        });

        return pendingWebSocket;
    } catch (error) {
        // TODO: Try and recreate a limited number of times. If no success then display message requesting refresh.
        if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ❌ Accounts WebSocket creation error: ${String(error)}`, error);
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
