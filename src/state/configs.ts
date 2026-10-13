// ── External Dependencies & Registrations
import { computed, type Ref, ref, shallowRef } from 'vue';
import { promiseTimeout, until } from '@vueuse/core';

// ── DPUse Framework
import { AppError, localiseConfigs } from '@dpuse/dpuse-shared';
import type {
    ConnectionConfig,
    ConnectorConfig,
    ContextConfig,
    CookbookConfig,
    EngineConfig,
    EventQueryConfig,
    LocalisedConfig,
    PresenterConfig,
    ToolConfig
} from '@dpuse/dpuse-shared';

// ── Local Framework
import { localeId } from '@/state/locale';
import { throwOnFault } from '@/observability/faultInjection';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';

// ── Data ─ Stands in for a real endpoint until one exists. See 'initialiseContextConfig'.
import contextConfigData from '@/features/studio/setup/context/_data/contextConfig.json';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ConnectionAccountConfig {
    connectorId: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const LOCAL_META_STORE_CONNECTOR_ID = 'dpuse-connector-dexie-js'; // The meta store is kept in the browser, through this connector.

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Resolves once the config monitor has either handled its first message or given up reconnecting. Await this before
// reading 'toolConfigs', 'presenterConfigs' or 'cookbookConfigs'. See 'whenRetrievalSettles'.
//
// Retrieval is started by the config monitor at application boot, so awaiting this never depends on which component
// mounted.
export function useConfigsReady(): Promise<void> {
    return whenRetrievalSettles(configRetrievalSucceeded, configRetrievalFailed);
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const connectionAccountConfigs = shallowRef<ConnectionAccountConfig[]>([]);
export const connectorConfigs = shallowRef<ConnectorConfig[]>([]);
export const contextConfig = shallowRef<ContextConfig | undefined>();
// Context has its own retrieval flags because it does not come through the config monitor yet. See
// 'initialiseContextConfig'.
export const contextConfigRetrievalSucceeded = ref(false);
export const contextConfigRetrievalFailed = ref(false);
export const contextConfigRetrievalFailure = shallowRef<AppFailure | undefined>();
export const cookbookConfigs = shallowRef<CookbookConfig[]>([]);
export const engineConfig = shallowRef<EngineConfig | undefined>();
export const eventQueryConfigs = shallowRef<EventQueryConfig[]>([]);
export const presenterConfigs = shallowRef<PresenterConfig[]>([]);
export const toolConfigs = shallowRef<ToolConfig[]>([]);
// True once the config monitor's first message has been handled. Before then an empty list means still loading, not
// empty. Code that loads a tool, presenter or cookbook awaits 'useConfigsReady' instead of watching this.
export const configRetrievalSucceeded = ref(false);
// True once the config monitor has given up reconnecting without ever connecting, so lists can show a 'couldn't
// connect' message instead of loading for ever. Cleared when a connection succeeds.
export const configRetrievalFailed = ref(false);
// The failure behind 'configRetrievalFailed'. Each list left empty shows it, so it is not also shown at app level.
export const configRetrievalFailure = shallowRef<AppFailure | undefined>();
// True once 'accountMonitor' has delivered at least one message for the current session. Cleared on sign-out
// alongside connectionAccountConfigs, since neither is meaningful while signed out.
export const accountConfigsAreRetrieved = ref(false);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Connectors that need no sign-in, plus the connectors the account has connected.
export const connectionConfigs = computed<ConnectionConfig[]>(() => {
    const configs: ConnectionConfig[] = [];

    for (const connectorConfig of connectorConfigs.value) {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-optional-chain -- TODO: These appear to be wrong, need to check actual input. The types are not guaranteed to match the actual data.
        if (connectorConfig.implementations.default && connectorConfig.implementations.default.authMethodId === 'none') configs.push(constructConnectionConfig(connectorConfig));
    }

    for (const connectionAccountConfig of connectionAccountConfigs.value) {
        const connectorConfig = connectorConfigs.value.find((config) => config.id === connectionAccountConfig.connectorId);
        if (connectorConfig != null) {
            configs.push(constructConnectionConfig(connectorConfig));
        }
    }

    return configs;
});

export const connectionLocalisedConfigs = computed((): LocalisedConfig<ConnectionConfig>[] => localiseConfigs<ConnectionConfig>(connectionConfigs.value, localeId.value, true));

export const metaStoreConnectionConfig = computed(() => {
    const metaStoreConnectorConfig: ConnectorConfig | undefined = connectorConfigs.value.find((connectorConfig) => connectorConfig.id === LOCAL_META_STORE_CONNECTOR_ID);
    return metaStoreConnectorConfig ? constructConnectionConfig(metaStoreConnectorConfig) : undefined;
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function initialiseConfigMonitor(): Promise<void> {
    try {
        if (import.meta.env.DEV) throwOnFault('config');
        const configMonitorModule = await import('@/observability/configMonitor');
        configMonitorModule.initialise();
    } catch (error) {
        // Setting 'configRetrievalFailed' lets 'useConfigsReady' stop waiting and the lists stop loading. The failure
        // is raised too, so the user is told why the lists are empty.
        configRetrievalFailed.value = true;
        raiseAppFailure(new AppError('Failed to load the configuration service.', 'dpuse-app.configs.initialiseConfigMonitor', { typeId: 'handled' }, { cause: error }), {
            capability: 'configuration'
        });
    }
}

// TODO: Replace the body below with a real fetch once the endpoint exists — e.g.
// 'contextConfig.value = (await (await fetch('/api/context-config')).json()) as ContextConfig;' — and drop
// 'contextConfigData' and the artificial delay, which only stand in for that.
export async function initialiseContextConfig(): Promise<void> {
    try {
        await promiseTimeout(400); // Simulates network latency until the real fetch exists.
        contextConfig.value = contextConfigData as ContextConfig;
        contextConfigRetrievalSucceeded.value = true;
    } catch (error) {
        contextConfigRetrievalFailed.value = true;
        contextConfigRetrievalFailure.value = raiseFailure(
            new AppError('Failed to load the context configuration.', 'dpuse-app.configs.initialiseContextConfig', { typeId: 'handled' }, { cause: error }),
            {
                capability: 'context'
            }
        );
    }
}

// Undefined when no id is given, or the connection has gone.
export function findConnectionLocalisedConfig(connectionId: string | undefined): LocalisedConfig<ConnectionConfig> | undefined {
    return connectionId == null ? undefined : connectionLocalisedConfigs.value.find((config) => config.id === connectionId);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Resolves rather than rejects when retrieval fails. A caller cannot recover from it, and the failure is already shown
// to the user, so the caller carries on and its own load attempt fails.
async function whenRetrievalSettles(retrievalSucceeded: Ref<boolean>, retrievalFailed: Ref<boolean>): Promise<void> {
    await until(() => retrievalSucceeded.value || retrievalFailed.value).toBe(true);
}

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
