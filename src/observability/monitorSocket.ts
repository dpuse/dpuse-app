// A WebSocket to the DPUse API that stays connected for the life of the page: keepalive pings, reconnection, and the
// page lifecycle. Shared by 'accountMonitor' and 'configMonitor', which differ only in what they do with messages, how
// often they retry, and whether they may reconnect at all.

// ── External Dependencies & Registrations
import { type MaybeRefOrGetter, watch } from 'vue';
import { type Pausable, useDocumentVisibility, useEventListener, useIntervalFn, useOnline, useWebSocket } from '@vueuse/core';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface MonitorSocketOptions<TMessage> {
    canReconnect?: () => boolean; // Checked before the page lifecycle reconnects, e.g. that someone is still signed in.
    isLogged: boolean;
    label: string; // Names the socket in the console.
    onConnected?: () => void;
    onDisconnected?: () => void; // Not called for a socket that has already been replaced.
    onFailed?: () => void; // Called once 'retries' says to stop.
    onMessage: (message: TMessage) => void;
    onRestart?: () => void; // Called before the page lifecycle reconnects, to clear any give-up state.
    retries: number | ((retried: number) => boolean); // -1 retries forever.
    url: MaybeRefOrGetter<string>;
}

interface MonitorSocket {
    close: () => void;
    online: Readonly<{ value: boolean }>;
    open: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Idle WebSockets get dropped by Cloudflare, by intermediate proxies and by mobile NATs, none of which publish a
// figure. 30s sits well inside the shortest of them.
const PING_INTERVAL_MS = 30_000;
const PING_MESSAGE = JSON.stringify({ typeId: 'ping' }); // The API answers this exact string itself, without waking.
const PONG_MESSAGE = JSON.stringify({ typeId: 'pong' });
const PONG_TIMEOUT_MS = 10_000;
const RECONNECT_DELAY_MS = 5000;

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Any message arriving within 'PONG_TIMEOUT_MS' of a ping proves the socket is alive; with none, the socket is closed
// and reconnected, which catches a connection that died silently and still looks open.
export function useMonitorSocket<TMessage>(options: MonitorSocketOptions<TMessage>): MonitorSocket {
    const { canReconnect = (): boolean => true, isLogged, label } = options;
    const online = useOnline();
    const state: { heartbeat: Pausable | undefined; isShutdown: boolean } = { heartbeat: undefined, isShutdown: false };

    const socket = useWebSocket(options.url, {
        autoClose: false, // Its 'beforeunload' listener would keep the page out of the back/forward cache; 'pagehide' is used instead.
        autoConnect: false,
        autoReconnect: { delay: RECONNECT_DELAY_MS, onFailed: options.onFailed, retries: options.retries },
        heartbeat: {
            message: PING_MESSAGE,
            pongTimeout: PONG_TIMEOUT_MS,
            responseMessage: PONG_MESSAGE,
            scheduler: (callback) => (state.heartbeat = useIntervalFn(callback, PING_INTERVAL_MS, { immediate: false }))
        },
        immediate: false,
        onConnected: () => {
            if (isLogged) console.info(`[dpuse:app] ✅  ${label} WebSocket connection opened.`);
            options.onConnected?.();
        },
        onDisconnected: (webSocket, event) => {
            const isSuperseded = webSocket !== socket.ws.value && socket.status.value !== 'CLOSED';
            if (isLogged) logClose(event.code, isSuperseded);
            if (!isSuperseded) {
                options.onDisconnected?.();
                return;
            }
            // VueUse pauses the heartbeat whenever any socket closes, including one already replaced — a 'pagehide' close
            // arriving after 'pageshow' has reconnected. Resumed so the live socket keeps its keepalive.
            if (socket.status.value === 'OPEN') state.heartbeat?.resume();
        },
        onError: (_webSocket, error) => {
            // A 'close' always follows an 'error', so reconnecting is left to that.
            if (isLogged) console.info(`[dpuse:app] ❌  ${label} WebSocket operational error.`, error);
        },
        onMessage: (_webSocket, event) => {
            try {
                options.onMessage(JSON.parse(event.data as string));
            } catch (error) {
                if (isLogged) console.info(`[dpuse:app] ❌  ${label} WebSocket message error: ${String(error)}`, error);
            }
        }
    });

    // Closed by the page being hidden and reopened if it is restored from the back/forward cache.
    useEventListener('pagehide', close);
    useEventListener('pageshow', (event) => {
        if (event.persisted && canReconnect()) restart();
    });

    // A backgrounded tab has its timers throttled and eventually frozen, so the ping stops and the connection is dropped
    // as idle, and a network that has come back is a better signal than any retry timer. Both reconnect at once rather
    // than wait — unless the socket was closed on purpose, which neither is a reason to undo.
    watch([useDocumentVisibility(), online], ([visibility, isOnline]) => {
        if (visibility === 'visible' && isOnline) restartIfDisconnected();
    });

    function close(): void {
        state.isShutdown = true;
        socket.close(1000, 'Client shutdown'); // An explicit code: a bare close sends none, which is reported back as 1005.
    }

    function logClose(code: number, isSuperseded: boolean): void {
        if (state.isShutdown) {
            console.info(`[dpuse:app] ✅  ${label} WebSocket connection closed.`);
            return;
        }
        console.info(`[dpuse:app] ⚠️  ${label} WebSocket close event '${String(code)}' received${isSuperseded ? ' for a replaced connection' : ''}.`);
    }

    function open(): void {
        if (socket.status.value !== 'CLOSED') return;
        state.isShutdown = false;
        socket.open();
    }

    function restart(): void {
        state.isShutdown = false;
        options.onRestart?.();
        socket.open();
    }

    function restartIfDisconnected(): void {
        if (state.isShutdown || socket.status.value !== 'CLOSED' || !canReconnect()) return;
        restart();
    }

    return { close, online, open };
}
