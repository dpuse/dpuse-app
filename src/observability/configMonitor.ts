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
import { raiseAppFailure } from '@/state/errors';
import { hasFault } from '@/observability/faultInjection';
import { configRetrievalFailed, configRetrievalSucceeded, connectorConfigs, cookbookConfigs, engineConfig, presenterConfigs, toolConfigs } from '@/state/session';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DPU_API_HOST = 'api.dpuse.app';
const TIMEOUT_DELAY = 5000;
// Cloudflare closes an idle WebSocket after ~100s with no traffic; ping well inside that margin to prevent it.
const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;
// Reconnect attempts before giving up and surfacing configRetrievalFailed — a persistently unreachable API
// shouldn't retry silently forever with no way for the user to know why every config list is stuck loading.
const MAX_RECONNECT_ATTEMPTS = 5;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const state: {
    webSocket: WebSocket | undefined;
    isWebSocketShutdown: boolean;
    pingIntervalId: ReturnType<typeof setInterval> | undefined;
    pongTimeoutId: ReturnType<typeof setTimeout> | undefined;
    reconnectAttempts: number;
} = {
    webSocket: undefined,
    isWebSocketShutdown: false,
    pingIntervalId: undefined,
    pongTimeoutId: undefined,
    reconnectAttempts: 0
};

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialise(): void {
    if (state.webSocket && (state.webSocket.readyState === WebSocket.CONNECTING || state.webSocket.readyState === WebSocket.OPEN)) {
        return;
    }

    state.webSocket = connectToWebSocket();
    window.addEventListener('pagehide', () => {
        shutdown();
    });
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) {
            return;
        }

        state.isWebSocketShutdown = false;
        state.reconnectAttempts = 0;
        configRetrievalFailed.value = false;
        state.webSocket = connectToWebSocket();
    });
}

// ── Helpers - WebSocket ──────────────────────────────────────────────────────────────────────────────────────────────

function connectToWebSocket(): WebSocket | undefined {
    // Skips straight to the give-up path rather than making the tester wait out five real reconnect delays.
    if (import.meta.env.DEV && hasFault('config-socket')) {
        state.reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
        scheduleReconnect();
        return undefined;
    }

    try {
        const url = `wss://${DPU_API_HOST}/configs/websocket`;
        const webSocket = new WebSocket(url);
        let pendingWebSocket: WebSocket | undefined = webSocket;

        pendingWebSocket.addEventListener('open', () => {
            if (import.meta.env.DEV) console.info('[dpuse:app] ✅  Configuration WebSocket connection opened.');
            state.reconnectAttempts = 0;
            configRetrievalFailed.value = false;
            startKeepalive(webSocket);
        });

        pendingWebSocket.addEventListener('message', (event) => {
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
                        unregisterConfigurations([eventData.module]);
                        return;
                }
            } catch (error) {
                if (import.meta.env.DEV) console.info(`[dpuse:app] ❌  Configuration registration error: ${String(error)}`, error);
            }
        });

        pendingWebSocket.addEventListener('close', (event) => {
            if (import.meta.env.DEV) console.info(`[dpuse:app] ⚠️  Configuration WebSocket close event '${String(event.code)}' received.`);
            stopKeepalive();
            pendingWebSocket = undefined;
            scheduleReconnect();
        });

        pendingWebSocket.addEventListener('error', (error) => {
            // The 'close' event always follows 'error' for a WebSocket, so reconnect scheduling lives there.
            if (import.meta.env.DEV) console.info('[dpuse:app] ❌  Configuration WebSocket operational error.', error);
        });

        return pendingWebSocket;
    } catch (error) {
        if (import.meta.env.DEV) console.info(`[dpuse:app] ❌  Configuration WebSocket creation error: ${String(error)}`, error);
        scheduleReconnect();
        return undefined;
    }
}

// Retries a limited number of times (with the reconnected socket's 'open' event resetting the counter), then gives
// up and surfaces the failure rather than retrying silently forever with no way for the user to know every config
// list is stuck loading.
function scheduleReconnect(): void {
    if (state.isWebSocketShutdown) return;
    state.reconnectAttempts++;
    if (state.reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
        if (import.meta.env.DEV) console.info('[dpuse:app] ❌  Configuration WebSocket reconnect attempts exhausted — giving up.');
        // The flag releases the awaits gated on retrieval; the failure is what tells the user why the lists they are
        // looking at came back empty. Raised at app level because the lists are spread across several panels and none
        // of them owns the connection.
        configRetrievalFailed.value = true;
        const data = { host: DPU_API_HOST, reconnectAttempts: state.reconnectAttempts - 1, typeId: 'handled' };
        raiseAppFailure(new AppError('Unable to connect to DPUse.', 'dpuse-app.configMonitor.scheduleReconnect', data), { capability: 'configuration' });
        return;
    }
    setTimeout(() => {
        state.webSocket = connectToWebSocket();
    }, TIMEOUT_DELAY);
}

// Sends a small 'ping' frame on an interval to reset Cloudflare's ~100s idle-connection timeout, and force-closes
// the socket if a 'pong' doesn't arrive in time — catching connections that die silently (no close frame ever
// arrives) rather than waiting indefinitely on a socket that looks OPEN but will never receive anything again.
function startKeepalive(webSocket: WebSocket): void {
    state.pingIntervalId = setInterval(() => {
        if (webSocket.readyState !== WebSocket.OPEN) return;
        webSocket.send(JSON.stringify({ typeId: 'ping' }));
        state.pongTimeoutId = setTimeout(() => {
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
    if (state.webSocket) {
        state.webSocket.close();
        state.webSocket = undefined;
    }
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

function unregisterConfigurations(moduleConfigs: ModuleConfig[]): void {
    const idsToRemove = new Set(moduleConfigs.filter((m) => m.typeId === 'connector').map((m) => m.id));
    if (idsToRemove.size > 0) {
        connectorConfigs.value = connectorConfigs.value.filter((c) => !idsToRemove.has(c.id));
    }
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
