// ── Local Framework
import { accountConfigsAreRetrieved, accountId, type ConnectionAccountConfig, connectionAccountConfigs } from '@/state/session';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DPU_API_HOST = 'api.dpuse.app';
const TIMEOUT_DELAY = 5000;
// Idle WebSockets get dropped by Cloudflare, by intermediate proxies and by mobile NATs, none of which publish a
// figure. 30s sits well inside the shortest of them.
const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const state: {
    areListenersRegistered: boolean;
    generation: number; // Bumped per connect attempt; handlers registered under an older one do nothing.
    isWebSocketShutdown: boolean;
    lastMessageAt: number; // Evidence the socket is alive, which the pong timeout checks before closing anything.
    pingIntervalId: ReturnType<typeof setInterval> | undefined;
    pongTimeoutId: ReturnType<typeof setTimeout> | undefined;
    webSocket: WebSocket | undefined;
} = {
    areListenersRegistered: false,
    generation: 0,
    isWebSocketShutdown: false,
    lastMessageAt: 0,
    pingIntervalId: undefined,
    pongTimeoutId: undefined,
    webSocket: undefined
};

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialise(): void {
    if (state.webSocket && (state.webSocket.readyState === WebSocket.CONNECTING || state.webSocket.readyState === WebSocket.OPEN)) {
        return;
    }

    state.isWebSocketShutdown = false;
    connectToWebSocket();
    if (state.areListenersRegistered) return;
    state.areListenersRegistered = true;

    window.addEventListener('pagehide', () => {
        shutdown();
    });
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) {
            return;
        }

        restart();
    });

    // A backgrounded tab has its timers throttled and eventually frozen, so the ping stops and the connection is
    // dropped as idle. Reconnect as soon as the tab is looked at again rather than waiting for a timer to notice.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        restartIfDisconnected();
    });
}

export function terminate(): void {
    shutdown();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Clears the shutdown 'pagehide' set and connects again, for a page restored from the back/forward cache.
function restart(): void {
    if (accountId.value == null) return; // Signed out, so there is no account socket to restore.
    state.isWebSocketShutdown = false;
    connectToWebSocket();
}

// Unlike 'restart', leaves a deliberate shutdown alone — sign-out calls 'terminate', and a tab being looked at again
// is no reason to undo that.
function restartIfDisconnected(): void {
    if (state.isWebSocketShutdown || accountId.value == null) return;
    if (state.webSocket?.readyState === WebSocket.CONNECTING || state.webSocket?.readyState === WebSocket.OPEN) return;
    connectToWebSocket();
}

// Every attempt claims a new generation, and each handler does nothing once the generation it was registered under is
// no longer current. That is what stops a socket being replaced from clearing its replacement's keepalive timers or
// scheduling a reconnect of its own: a 'pagehide' close arriving after 'pageshow' had already reconnected used to
// leave two live sockets sharing one pair of timer handles, and they would take turns closing each other.
function connectToWebSocket(): void {
    discardWebSocket();
    const generation = ++state.generation;

    // Data from a previous connection can't be trusted as current until this connection has proven itself.
    accountConfigsAreRetrieved.value = false;
    try {
        const url = `wss://${DPU_API_HOST}/accounts/${String(accountId.value)}/websocket`;
        const webSocket = new WebSocket(url);
        state.webSocket = webSocket;

        webSocket.addEventListener('open', () => {
            if (generation !== state.generation) return;
            if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ✅  Account WebSocket connection opened.`);
            startKeepalive(webSocket, generation);
        });

        webSocket.addEventListener('message', (event) => {
            if (generation !== state.generation) return;
            state.lastMessageAt = Date.now();
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

        webSocket.addEventListener('close', (event) => {
            if (generation !== state.generation) return;
            if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ⚠️  Account WebSocket close event '${String(event.code)}' received.`);
            stopKeepalive();
            state.webSocket = undefined;
            scheduleReconnect(generation);
        });

        webSocket.addEventListener('error', (error) => {
            // The 'close' event always follows 'error' for a WebSocket, so reconnect scheduling lives there.
            if (import.meta.env.DEV || import.meta.env.PROD) console.info('[dpuse:app] ❌  Account WebSocket operational error.', error);
        });
    } catch (error) {
        // TODO: Try and recreate a limited number of times. If no success then display message requesting refresh.
        if (import.meta.env.DEV || import.meta.env.PROD) console.info(`[dpuse:app] ❌  Account WebSocket creation error: ${String(error)}`, error);
    }
}

// Closes whatever socket is currently held. The generation bump that follows makes its handlers inert, so nothing
// else would ever clean it up.
function discardWebSocket(): void {
    stopKeepalive();
    const webSocket = state.webSocket;
    state.webSocket = undefined;
    if (webSocket && (webSocket.readyState === WebSocket.CONNECTING || webSocket.readyState === WebSocket.OPEN)) webSocket.close();
}

function scheduleReconnect(generation: number): void {
    if (state.isWebSocketShutdown || generation !== state.generation) return;
    setTimeout(() => {
        if (state.isWebSocketShutdown || generation !== state.generation) return;
        connectToWebSocket();
    }, TIMEOUT_DELAY);
}

// Sends a small 'ping' on an interval to stop the connection being dropped as idle, and force-closes the socket if a
// 'pong' doesn't arrive in time — catching connections that die silently (no close frame ever arrives) rather than
// waiting indefinitely on a socket that looks OPEN but will never receive anything again.
function startKeepalive(webSocket: WebSocket, generation: number): void {
    stopKeepalive();
    state.pingIntervalId = setInterval(() => {
        if (generation !== state.generation || webSocket.readyState !== WebSocket.OPEN) return;
        clearPongTimeout(); // A previous tick's timer is abandoned rather than left to fire against this tick's ping.
        const pingSentAt = Date.now();
        webSocket.send(JSON.stringify({ typeId: 'ping' }));
        state.pongTimeoutId = setTimeout(() => {
            if (generation !== state.generation) return;
            // A throttled background timer can fire long after it was set, by which point the pong has usually
            // arrived. Closing on the timer alone would drop a healthy socket, so look for traffic instead.
            if (state.lastMessageAt >= pingSentAt) return;
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
    if (state.pongTimeoutId === undefined) return;

    clearTimeout(state.pongTimeoutId);
    state.pongTimeoutId = undefined;
}

function shutdown(): void {
    state.isWebSocketShutdown = true;
    state.generation++;
    discardWebSocket();
}
