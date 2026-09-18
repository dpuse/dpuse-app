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
import { useMonitorSocket } from '@/observability/monitorSocket';
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

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type ConfigMessage = { typeId: 'delete'; id: string } | { typeId: 'deploy'; module: ModuleConfig } | { typeId: 'init'; modules: ModuleConfig[] };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DPU_API_HOST = 'api.dpuse.app';
// Reconnect attempts before giving up and surfacing configRetrievalFailed — a persistently unreachable API
// shouldn't retry silently forever with no way for the user to know why every config list is stuck loading.
const MAX_RECONNECT_ATTEMPTS = 5;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const state = { reconnectAttempts: 0 }; // Kept for the failure report, which is raised after the count has been used.

// Retries a limited number of times (the reconnected socket's 'open' resetting the count), then gives up and surfaces
// the failure rather than retrying silently forever with no way for the user to know every config list is stuck
// loading.
//
// Offline it gives up at once instead. The retry budget is there for a server that might answer on the next attempt,
// and a browser reporting no network at all will not — so spending it costs 25 seconds and finds out nothing. It is not
// a short wait either: 'useConfigsReady' is gated on this settling, so every tool, presenter and cookbook in the app
// waits it out before it can even fail.
const socket = useMonitorSocket<ConfigMessage>({
    isLogged: import.meta.env.DEV,
    label: 'Configuration',
    onConnected: () => {
        configRetrievalFailed.value = false;
    },
    onFailed: handleRetrievalFailed,
    onMessage: (message) => {
        switch (message.typeId) {
            case 'init':
                registerConfigurations(message.modules);
                configRetrievalSucceeded.value = true;
                return;
            case 'deploy':
                registerConfigurations([message.module]);
                return;
            case 'delete':
                unregisterModuleConfig(message.id);
                return;
        }
    },
    // Clears the give-up state for the cases where another try is worth it: a page restored from the back/forward
    // cache, a network that has come back, a tab brought back to the foreground.
    onRestart: () => {
        configRetrievalFailed.value = false;
        configRetrievalFailure.value = undefined;
    },
    retries: (retried): boolean => {
        state.reconnectAttempts = retried;
        return retried < MAX_RECONNECT_ATTEMPTS && socket.online.value;
    },
    url: `wss://${DPU_API_HOST}/configs/websocket`
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialise(): void {
    // Skips straight to the give-up path rather than making the tester wait out five real reconnect delays.
    if (import.meta.env.DEV && hasFault('config-socket')) {
        state.reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
        handleRetrievalFailed();
        return;
    }
    socket.open();
}

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetrievalFailed(): void {
    const isOnline = socket.online.value;
    if (import.meta.env.DEV) console.info(`[dpuse:app] ❌  Configuration WebSocket giving up — ${isOnline ? 'reconnect attempts exhausted' : 'browser reports no network'}.`);
    // The flag releases the awaits gated on retrieval; the failure is what tells the user why the lists they are
    // looking at came back empty.
    //
    // Not raised at app level, though nothing owns the connection: every consequence of it is regional — a list with
    // no rows, a picker with nothing to pick — and those regions each show this. Announcing it over the top as well put
    // the same sentence on screen twice at once, which reads as two problems.
    configRetrievalFailed.value = true;
    const data = { host: DPU_API_HOST, isOnline, reconnectAttempts: state.reconnectAttempts, typeId: 'handled' };
    configRetrievalFailure.value = raiseFailure(new AppError('Unable to connect to DPUse.', 'dpuse-app.configMonitor.handleRetrievalFailed', data), {
        capability: 'configuration'
    });
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
