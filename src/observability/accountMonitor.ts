// ── Local Framework
import { accountConfigsAreRetrieved, accountId, type ConnectionAccountConfig, connectionAccountConfigs } from '@/state/session';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DPU_API_HOST = 'api.dpuse.app';
const TIMEOUT_DELAY = 5000;
// Cloudflare closes an idle WebSocket after ~100s with no traffic; ping well inside that margin to prevent it.
const PING_INTERVAL_MS = 30000;
const PONG_TIMEOUT_MS = 10000;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const state: {
    webSocket: WebSocket | undefined;
    isWebSocketShutdown: boolean;
    pingIntervalId: ReturnType<typeof setInterval> | undefined;
    pongTimeoutId: ReturnType<typeof setTimeout> | undefined;
} = {
    webSocket: undefined,
    isWebSocketShutdown: false,
    pingIntervalId: undefined,
    pongTimeoutId: undefined
};

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function connectToWebSocket(): WebSocket | undefined {
    // Data from a previous connection can't be trusted as current until this connection has proven itself.
    accountConfigsAreRetrieved.value = false;
    try {
        const url = `wss://${DPU_API_HOST}/accounts/${accountId.value}/websocket`;
        let pendingWebSocket: WebSocket | undefined = new WebSocket(url);

        pendingWebSocket.addEventListener('open', () => {
            if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ✅  Account WebSocket connection opened.`);
            startKeepalive(pendingWebSocket!);
        });

        pendingWebSocket.addEventListener('message', (event) => {
            try {
                const eventData = JSON.parse(event.data);
                if (eventData.typeId === 'pong') {
                    clearPongTimeout();
                    return;
                }
                const connections = eventData.config?.connections ?? [];
                const configs: ConnectionAccountConfig[] = Array.from(connections, (connection: { connectorId: string }) => ({
                    connectorId: connection.connectorId
                }));
                connectionAccountConfigs.value = configs;
                accountConfigsAreRetrieved.value = true;
            } catch (error) {
                if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ❌  Account configuration retrieval error: ${String(error)}`, error);
            }
        });

        pendingWebSocket.addEventListener('close', (event) => {
            if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ⚠️  Account WebSocket close event '${event.code}' received.`);
            stopKeepalive();
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

// Sends a small 'ping' frame on an interval to reset Cloudflare's ~100s idle-connection timeout, and force-closes
// the socket if a 'pong' doesn't arrive in time — catching connections that die silently (no close frame ever
// arrives) rather than waiting indefinitely on a socket that looks OPEN but will never receive anything again.
function startKeepalive(webSocket: WebSocket): void {
    state.pingIntervalId = setInterval(() => {
        if (webSocket.readyState !== WebSocket.OPEN) return;
        webSocket.send(JSON.stringify({ typeId: 'ping' }));
        state.pongTimeoutId = setTimeout(() => {
            if (import.meta.env.DEV || import.meta.env.PROD) console.info('[dpuse:app] ⚠️  Account WebSocket ping timed out — forcing reconnect.');
            webSocket.close();
        }, PONG_TIMEOUT_MS);
    }, PING_INTERVAL_MS);
}

function stopKeepalive(): void {
    if (state.pingIntervalId !== undefined) {
        clearInterval(state.pingIntervalId);
        state.pingIntervalId = undefined;
    }
    clearPongTimeout();
}

function clearPongTimeout(): void {
    if (state.pongTimeoutId !== undefined) {
        clearTimeout(state.pongTimeoutId);
        state.pongTimeoutId = undefined;
    }
}

function shutdown(): void {
    state.isWebSocketShutdown = true;
    if (state.webSocket) {
        state.webSocket.close();
        state.webSocket = undefined;
    }
}
