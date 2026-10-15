// ── External Dependencies & Registrations
import type { ShallowRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { ConnectionConfig, ConnectorConfig, CookbookConfig, EngineConfig, ModuleConfig, PresenterConfig, ToolConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { DPUSE_API_HOST } from '@/observability/eventTracking';
import { raiseFailure } from '@/state/errors';
import { useMonitorSocket } from '@/observability/monitorSocket';
import { announceAppVersion, announceModuleUpdate } from '@/state/appVersion';
import { configStatus, connectorConfigs, cookbookConfigs, engineConfig, presenterConfigs, toolConfigs } from '@/state/configs';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type ConfigMessage = { typeId: 'clear' } | { typeId: 'delete'; id: string } | { typeId: 'deploy'; module: ModuleConfig } | { typeId: 'init'; modules: ModuleConfig[] };

interface RegistrationState {
    isConnectorRegistered: boolean;
    isCookbookRegistered: boolean;
    isPresenterRegistered: boolean;
    isToolRegistered: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const MAX_RECONNECT_ATTEMPTS = 5;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const state: { moduleListSignature: string | undefined; reconnectAttempts: number } = {
    moduleListSignature: undefined, // The modules this page started with, to compare against the list a reconnect brings.
    reconnectAttempts: 0 // Kept for the failure report, which is raised after the count has been used.
};

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
    onFailed: handleRetrievalFailed,
    onMessage: (message) => {
        switch (message.typeId) {
            case 'init':
                registerConfigurations(message.modules, true);
                compareModuleList(message.modules);
                configStatus.value = { typeId: 'ready' };
                return;
            case 'deploy':
                registerConfigurations([message.module], false);
                if (message.module.typeId !== 'app') announceModuleUpdate(); // A new app version has its own notice.
                return;
            case 'delete':
                unregisterModuleConfig(message.id);
                announceModuleUpdate();
                return;
            case 'clear':
                announceModuleUpdate(); // The reload fetches the emptied list, so the lists are left as they are.
                return;
        }
    },
    // Clears the give-up state for the cases where another try is worth it: a page restored from the back/forward
    // cache, a network that has come back, a tab brought back to the foreground.
    onRestart: () => {
        if (configStatus.value.typeId === 'failed') configStatus.value = { typeId: 'pending' };
    },
    retries: (retried): boolean => {
        state.reconnectAttempts = retried;
        return retried < MAX_RECONNECT_ATTEMPTS && socket.online.value;
    },
    url: `wss://${DPUSE_API_HOST}/configs/websocket`
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialise(): void {
    socket.open();
}

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetrievalFailed(): void {
    const isOnline = socket.online.value;
    if (import.meta.env.DEV) console.info(`[dpuse:app] ❌  Configuration WebSocket giving up — ${isOnline ? 'reconnect attempts exhausted' : 'browser reports no network'}.`);
    // The failed status releases 'useConfigsReady' and shows the failure on each screen that needs the configuration.
    // It is not raised at app level as well, because the same message on screen twice reads as two problems.
    const data = { host: DPUSE_API_HOST, isOnline, reconnectAttempts: state.reconnectAttempts, typeId: 'handled' };
    const failure = raiseFailure(new AppError('Unable to connect to DPUse.', 'dpuse-app.configMonitor.handleRetrievalFailed', data), {
        capability: 'configuration'
    });
    configStatus.value = { typeId: 'failed', failure };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Registration
// A full list replaces every list, so a module deleted while the socket was down does not stay listed. A single
// module is merged into the lists as they are.
function registerConfigurations(moduleConfigs: ModuleConfig[], isFullList: boolean): void {
    const registrationState: RegistrationState = {
        isConnectorRegistered: isFullList,
        isCookbookRegistered: isFullList,
        isPresenterRegistered: isFullList,
        isToolRegistered: isFullList
    };
    const pendingConnectorConfigs = isFullList ? [] : [...connectorConfigs.value];
    const pendingCookbookConfigs = isFullList ? [] : [...cookbookConfigs.value];
    const pendingPresenterConfigs = isFullList ? [] : [...presenterConfigs.value];
    const pendingToolConfigs = isFullList ? [] : [...toolConfigs.value];

    for (const moduleConfig of moduleConfigs) {
        registerModuleConfig(moduleConfig, pendingConnectorConfigs, pendingCookbookConfigs, pendingPresenterConfigs, pendingToolConfigs, registrationState);
    }

    if (registrationState.isConnectorRegistered) connectorConfigs.value = [...pendingConnectorConfigs];
    if (registrationState.isCookbookRegistered) cookbookConfigs.value = [...pendingCookbookConfigs];
    if (registrationState.isPresenterRegistered) presenterConfigs.value = [...pendingPresenterConfigs];
    if (registrationState.isToolRegistered) toolConfigs.value = [...pendingToolConfigs];
}

function registerModuleConfig(
    moduleConfig: ModuleConfig,
    pendingConnectorConfigs: ConnectorConfig[],
    pendingCookbookConfigs: CookbookConfig[],
    pendingPresenterConfigs: PresenterConfig[],
    pendingToolConfigs: ToolConfig[],
    registrationState: RegistrationState
): void {
    // TODO: Only register if new added or new version. Can we import in parallel for efficiency?
    switch (moduleConfig.typeId) {
        case 'app':
            registerAppVersion(moduleConfig.version);
            logRegistered('App', moduleConfig);
            return;
        case 'engine':
            engineConfig.value = moduleConfig as EngineConfig;
            logRegistered('Engine', moduleConfig);
            return;
        case 'connector':
            if (moduleConfig.id === 'dpuse-connector-template') return;
            registrationState.isConnectorRegistered = true;
            upsertConfig(pendingConnectorConfigs, moduleConfig as ConnectorConfig);
            logRegistered('Connector', moduleConfig);
            return;
        case 'cookbook':
            registrationState.isCookbookRegistered = true;
            upsertConfig(pendingCookbookConfigs, moduleConfig as CookbookConfig);
            logRegistered('Cookbook', moduleConfig);
            return;
        case 'presenter':
            registrationState.isPresenterRegistered = true;
            upsertConfig(pendingPresenterConfigs, moduleConfig as PresenterConfig);
            logRegistered('Presenter', moduleConfig);
            return;
        case 'tool':
            registrationState.isToolRegistered = true;
            upsertConfig(pendingToolConfigs, moduleConfig as ToolConfig);
            logRegistered('Tool', moduleConfig);
            return;
    }
}

// Replaces the config with the same id, or adds it when the list has none.
function upsertConfig<Config extends { id: string }>(configs: Config[], config: Config): void {
    const index = configs.findIndex((existingConfig) => existingConfig.id === config.id);
    if (index === -1) {
        configs.push(config);
    } else {
        configs[index] = config;
    }
}

// The first list is what this page loaded with. A list arriving after a reconnect may hold changes made while the
// socket was down, which no 'deploy' or 'delete' message reported.
function compareModuleList(moduleConfigs: ModuleConfig[]): void {
    const signature = moduleConfigs
        .filter((moduleConfig) => moduleConfig.typeId !== 'app')
        .map((moduleConfig) => `${moduleConfig.id}@${moduleConfig.version}`)
        .toSorted((left, right) => left.localeCompare(right))
        .join('|');
    if (state.moduleListSignature == null) {
        state.moduleListSignature = signature;
        return;
    }
    if (signature !== state.moduleListSignature) announceModuleUpdate();
}

// Tells a running copy that a newer version has been deployed.
function registerAppVersion(deployedVersion: string): void {
    announceAppVersion(deployedVersion);
}

function logRegistered(name: string, moduleConfig: ModuleConfig): void {
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

// ── Connection
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
