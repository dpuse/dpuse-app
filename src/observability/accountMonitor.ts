// Local (App) Framework
import { accountId, type ConnectionAccountConfig, connectionAccountConfigs } from '@/state/session';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const DPU_API_HOST = 'api.dpuse.app';
const TIMEOUT_DELAY = 5000;

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const state: { webSocket: WebSocket | undefined; isWebSocketShutdown: boolean } = {
    webSocket: undefined,
    isWebSocketShutdown: false
};

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialise(): void {
    if (state.webSocket && (state.webSocket.readyState === WebSocket.CONNECTING || state.webSocket.readyState === WebSocket.OPEN)) {
        return;
    }

    state.isWebSocketShutdown = false;
    state.webSocket = connectToWebSocket();
    window.addEventListener('pagehide', () => shutdown());
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) {
            return;
        }

        state.isWebSocketShutdown = false;
        state.webSocket = connectToWebSocket();
    });
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
            if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ✅  Account WebSocket connection opened.`);
        });

        pendingWebSocket.addEventListener('message', (event) => {
            try {
                const eventData = JSON.parse(event.data);
                const configs: ConnectionAccountConfig[] = Array.from(eventData.config.connections, (connection: { connectorId: string }) => ({
                    connectorId: connection.connectorId
                }));
                connectionAccountConfigs.value = configs;
            } catch (error) {
                if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ❌  Account configuration retrieval error: ${String(error)}`, error);
            }
        });

        pendingWebSocket.addEventListener('close', (event) => {
            if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ⚠️  Account WebSocket close event '${event.code}' received.`);
            pendingWebSocket = undefined;
            if (!state.isWebSocketShutdown) setTimeout(connectToWebSocket, TIMEOUT_DELAY);
        });

        pendingWebSocket.addEventListener('error', (error) => {
            // TODO: Try and reconnect a limited number of times. If no success then display message requesting refresh.
            if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ❌  Account WebSocket operational error: ${String(error)}`, error);
        });

        return pendingWebSocket;
    } catch (error) {
        // TODO: Try and recreate a limited number of times. If no success then display message requesting refresh.
        if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ❌  Account WebSocket creation error: ${String(error)}`, error);
        return undefined;
    }
}

function shutdown(): void {
    state.isWebSocketShutdown = true;
    if (state.webSocket) {
        state.webSocket.close();
        state.webSocket = undefined;
    }
}
