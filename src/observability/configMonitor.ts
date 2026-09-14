// ── External Dependencies & Registrations
import type { ShallowRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import type { CookbookConfig } from '@dpuse/dpuse-shared/component/module/cookbook';
import type { EngineConfig } from '@dpuse/dpuse-shared/component/module/engine';
import type { ModuleConfig } from '@dpuse/dpuse-shared/component/module';
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';

// ── Local Framework
import { raiseFailure } from '@/state/errors';
import { hasFault } from '@/observability/faultInjection';
import {
    configRetrievalFailed,
    configRetrievalFailure,
    configRetrievalSucceeded,
    connectorConfigs,
    cookbookConfigs,
    engineConfig,
    presenterConfigs,
    toolConfigs
} from '@/state/session';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DPU_API_HOST = 'api.dpuse.app';
const TIMEOUT_DELAY = 5000;
// Idle WebSockets get dropped by Cloudflare, by intermediate proxies and by mobile NATs, none of which publish a
// figure. 30s sits well inside the shortest of them.
const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;
// Reconnect attempts before giving up and surfacing configRetrievalFailed — a persistently unreachable API
// shouldn't retry silently forever with no way for the user to know why every config list is stuck loading.
const MAX_RECONNECT_ATTEMPTS = 5;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const state: {
    areListenersRegistered: boolean;
    generation: number; // Bumped per connect attempt; handlers registered under an older one do nothing.
    isWebSocketShutdown: boolean;
    lastMessageAt: number; // Evidence the socket is alive, which the pong timeout checks before closing anything.
    pingIntervalId: ReturnType<typeof setInterval> | undefined;
    pongTimeoutId: ReturnType<typeof setTimeout> | undefined;
    reconnectAttempts: number;
    webSocket: WebSocket | undefined;
} = {
    areListenersRegistered: false,
    generation: 0,
    isWebSocketShutdown: false,
    lastMessageAt: 0,
    pingIntervalId: undefined,
    pongTimeoutId: undefined,
    reconnectAttempts: 0,
    webSocket: undefined
};

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialise(): void {
    if (state.webSocket && (state.webSocket.readyState === WebSocket.CONNECTING || state.webSocket.readyState === WebSocket.OPEN)) {
        return;
    }

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

    // Giving up was final for the session until now, so a user who loaded offline stayed broken after the network came
    // back. The browser tells us the moment it returns, which is a better signal than any timer.
    addEventListener('online', () => {
        restartIfDisconnected();
    });

    // A backgrounded tab has its timers throttled and eventually frozen, so the ping stops and the connection is
    // dropped as idle. Reconnect as soon as the tab is looked at again rather than waiting for a timer to notice.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        restartIfDisconnected();
    });
}

// ── Helpers - WebSocket ──────────────────────────────────────────────────────────────────────────────────────────────

// Clears the give-up state and connects again, for the cases where another try is worth it: a page restored from the
// back/forward cache, a network that has come back, a tab brought back to the foreground.
function restart(): void {
    state.isWebSocketShutdown = false;
    state.reconnectAttempts = 0;
    configRetrievalFailed.value = false;
    configRetrievalFailure.value = undefined;
    connectToWebSocket();
}

function restartIfDisconnected(): void {
    if (state.isWebSocketShutdown) return;
    if (state.webSocket?.readyState === WebSocket.CONNECTING || state.webSocket?.readyState === WebSocket.OPEN) return;
    restart();
}

// Every attempt claims a new generation, and each handler does nothing once the generation it was registered under is
// no longer current. That is what stops a socket being replaced from clearing its replacement's keepalive timers or
// scheduling a reconnect of its own: a 'pagehide' close arriving after 'pageshow' had already reconnected used to
// leave two live sockets sharing one pair of timer handles, and they would take turns closing each other.
function connectToWebSocket(): void {
    discardWebSocket();
    const generation = ++state.generation;

    // Skips straight to the give-up path rather than making the tester wait out five real reconnect delays.
    if (import.meta.env.DEV && hasFault('config-socket')) {
        state.reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
        scheduleReconnect(generation);
        return;
    }

    try {
        const url = `wss://${DPU_API_HOST}/configs/websocket`;
        const webSocket = new WebSocket(url);
        state.webSocket = webSocket;

        webSocket.addEventListener('open', () => {
            if (generation !== state.generation) return;
            if (import.meta.env.DEV) console.info('[dpuse:app] ✅  Configuration WebSocket connection opened.');
            state.reconnectAttempts = 0;
            configRetrievalFailed.value = false;
            startKeepalive(webSocket, generation);
        });

        webSocket.addEventListener('message', (event) => {
            if (generation !== state.generation) return;
            state.lastMessageAt = Date.now();
            try {
                const eventData = JSON.parse(event.data);
                switch (eventData.typeId) {
                    case 'pong':
                        clearPongTimeout();
                        return;
                    case 'init':
                        registerConfigurations(eventData.modules);
                        configRetrievalSucceeded.value = true;
                        return;
                    case 'deploy':
                        registerConfigurations([eventData.module]);
                        return;
                    case 'delete':
                        unregisterModuleConfig(eventData.id);
                        return;
                }
            } catch (error) {
                if (import.meta.env.DEV) console.info(`[dpuse:app] ❌  Configuration registration error: ${String(error)}`, error);
            }
        });

        webSocket.addEventListener('close', (event) => {
            if (generation !== state.generation) return;
            if (import.meta.env.DEV) console.info(`[dpuse:app] ⚠️  Configuration WebSocket close event '${String(event.code)}' received.`);
            stopKeepalive();
            state.webSocket = undefined;
            scheduleReconnect(generation);
        });

        webSocket.addEventListener('error', (error) => {
            // The 'close' event always follows 'error' for a WebSocket, so reconnect scheduling lives there.
            if (import.meta.env.DEV) console.info('[dpuse:app] ❌  Configuration WebSocket operational error.', error);
        });
    } catch (error) {
        if (import.meta.env.DEV) console.info(`[dpuse:app] ❌  Configuration WebSocket creation error: ${String(error)}`, error);
        scheduleReconnect(generation);
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

// Retries a limited number of times (with the reconnected socket's 'open' event resetting the counter), then gives
// up and surfaces the failure rather than retrying silently forever with no way for the user to know every config
// list is stuck loading.
//
// Offline it gives up at once instead. The retry budget is there for a server that might answer on the next attempt,
// and a browser reporting no network at all will not — so spending it costs 25 seconds and finds out nothing. It is
// not a short wait either: 'useConfigsReady' is gated on this settling, so every tool, presenter and cookbook in the
// app waits it out before it can even fail.
function scheduleReconnect(generation: number): void {
    if (state.isWebSocketShutdown || generation !== state.generation) return;
    state.reconnectAttempts++;
    if (state.reconnectAttempts > MAX_RECONNECT_ATTEMPTS || !navigator.onLine) {
        if (import.meta.env.DEV) {
            console.info(`[dpuse:app] ❌  Configuration WebSocket giving up — ${navigator.onLine ? 'reconnect attempts exhausted' : 'browser reports no network'}.`);
        }
        // The flag releases the awaits gated on retrieval; the failure is what tells the user why the lists they are
        // looking at came back empty.
        //
        // Not raised at app level, though nothing owns the connection: every consequence of it is regional — a list
        // with no rows, a picker with nothing to pick — and those regions each show this. Announcing it over the top
        // as well put the same sentence on screen twice at once, which reads as two problems.
        configRetrievalFailed.value = true;
        const data = { host: DPU_API_HOST, isOnline: navigator.onLine, reconnectAttempts: state.reconnectAttempts - 1, typeId: 'handled' };
        configRetrievalFailure.value = raiseFailure(new AppError('Unable to connect to DPUse.', 'dpuse-app.configMonitor.scheduleReconnect', data), {
            capability: 'configuration'
        });
        return;
    }
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
            if (import.meta.env.DEV) console.info('[dpuse:app] ⚠️  Configuration WebSocket ping timed out — forcing reconnect.');
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

// ── Helpers - Registration ───────────────────────────────────────────────────────────────────────────────────────────

function registerConfigurations(moduleConfigs: ModuleConfig[]): void {
    const registrationState = {
        isConnectorRegistered: false,
        isPresenterRegistered: false,
        isCookbookRegistered: false,
        isToolRegistered: false
    };
    const pendingConnectorConfigs = [...connectorConfigs.value];
    const pendingCookbookConfigs = [...cookbookConfigs.value];
    const pendingPresenterConfigs = [...presenterConfigs.value];
    const pendingToolConfigs = [...toolConfigs.value];

    for (const moduleConfig of moduleConfigs) {
        doRegister(moduleConfig, pendingConnectorConfigs, pendingCookbookConfigs, pendingPresenterConfigs, pendingToolConfigs, registrationState);
    }

    if (registrationState.isConnectorRegistered) connectorConfigs.value = [...pendingConnectorConfigs];
    if (registrationState.isCookbookRegistered) cookbookConfigs.value = [...pendingCookbookConfigs];
    if (registrationState.isPresenterRegistered) presenterConfigs.value = [...pendingPresenterConfigs];
    if (registrationState.isToolRegistered) toolConfigs.value = [...pendingToolConfigs];
}

function doRegister(
    moduleConfig: ModuleConfig,
    pendingConnectorConfigs: ConnectorConfig[],
    pendingCookbookConfigs: CookbookConfig[],
    pendingPresenterConfigs: PresenterConfig[],
    pendingToolConfigs: ToolConfig[],
    registrationState: Record<string, boolean>
): void {
    // TODO: Only register if new added or new version. Can we import in parallel for efficiency?
    switch (moduleConfig.typeId) {
        case 'app':
            logIt('App', moduleConfig);
            return;
        case 'engine':
            engineConfig.value = moduleConfig as EngineConfig;
            logIt('Engine', moduleConfig);
            return;
        case 'connector': {
            if (moduleConfig.id === 'dpuse-connector-template') return;
            registrationState.isConnectorRegistered = true;
            const index = pendingConnectorConfigs.findIndex((connectorConfig) => connectorConfig.id === moduleConfig.id);
            if (index === -1) {
                pendingConnectorConfigs.push(moduleConfig as ConnectorConfig);
            } else {
                pendingConnectorConfigs[index] = moduleConfig as ConnectorConfig;
            }
            logIt('Connector', moduleConfig);
            return;
        }
        case 'cookbook':
            registrationState.isCookbookRegistered = true;
            const index = pendingCookbookConfigs.findIndex((cookbookConfig) => cookbookConfig.id === moduleConfig.id);
            if (index === -1) {
                pendingCookbookConfigs.push(moduleConfig as CookbookConfig);
            } else {
                pendingCookbookConfigs[index] = moduleConfig as CookbookConfig;
            }
            logIt('Cookbook', moduleConfig);
            return;
        case 'presenter': {
            registrationState.isPresenterRegistered = true;
            const index = pendingPresenterConfigs.findIndex((presenterConfig) => presenterConfig.id === moduleConfig.id);
            if (index === -1) {
                pendingPresenterConfigs.push(moduleConfig as PresenterConfig);
            } else {
                pendingPresenterConfigs[index] = moduleConfig as PresenterConfig;
            }
            logIt('Presenter', moduleConfig);
            return;
        }
        case 'tool': {
            registrationState.isToolRegistered = true;
            const index = pendingToolConfigs.findIndex((toolConfig) => toolConfig.id === moduleConfig.id);
            if (index === -1) {
                pendingToolConfigs.push(moduleConfig as ToolConfig);
            } else {
                pendingToolConfigs[index] = moduleConfig as ToolConfig;
            }
            logIt('Tool', moduleConfig);
            return;
        }
    }
}

function logIt(name: string, moduleConfig: ModuleConfig): void {
    if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️  ${name} '${moduleConfig.id}' v${moduleConfig.version} registered.`);
}

// The server sends only the id, so every list is checked. Ids are unique across module types, so at most one matches.
function unregisterModuleConfig(id: string): void {
    removeConfig(connectorConfigs, id);
    removeConfig(cookbookConfigs, id);
    removeConfig(presenterConfigs, id);
    removeConfig(toolConfigs, id);
}

// Only reassigns when the id was actually present, so a delete doesn't churn the lists it has nothing to do with.
function removeConfig<Config extends { id: string }>(configs: ShallowRef<Config[]>, id: string): void {
    if (configs.value.every((config) => config.id !== id)) return;
    configs.value = configs.value.filter((config) => config.id !== id);
}

// ── Helpers - Connection ─────────────────────────────────────────────────────────────────────────────────────────────

function constructConnectionConfig(connectorConfig: ConnectorConfig): ConnectionConfig {
    return {
        id: connectorConfig.id,
        description: connectorConfig.description,
        authorisation: {},
        connectorConfig,
        firstCreatedAt: null,
        icon: connectorConfig.icon,
        iconDark: connectorConfig.iconDark,
        lastVerifiedAt: 0,
        lastUpdatedAt: null,
        label: connectorConfig.label,
        notation: undefined,
        status: null,
        statusId: connectorConfig.statusId,
        typeId: 'connectorConnection'
    };
}
