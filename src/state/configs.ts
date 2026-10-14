// ── External Dependencies & Registrations
import { computed, shallowRef } from 'vue';
import { promiseTimeout, until } from '@vueuse/core';

// ── DPUse Framework
import type {
    AccountConnectionConfig,
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
import { AppError, localiseConfigs } from '@dpuse/dpuse-shared';

// ── Local Framework
import { localeId } from '@/state/locale';
import { throwOnFault } from '@/observability/faultInjection';
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Data ─ Stands in for a real endpoint until one exists. See 'initialiseContextConfig'.
import contextConfigData from '@/features/studio/setup/context/_data/contextConfig.json';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The parts of a saved account connection the app uses to build its connection.
export type ConnectionAccountConfig = Pick<AccountConnectionConfig, 'connectorId' | 'id'>;

// Where a retrieval has got to. Until it is 'ready', an empty list means still loading, not empty.
export type RetrievalStatus = { typeId: 'failed'; failure: AppFailure } | { typeId: 'pending' } | { typeId: 'ready' };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const LOCAL_META_STORE_CONNECTOR_ID = 'dpuse-connector-dexie-js'; // The meta store is kept in the browser, through this connector.

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Resolves once the configuration has arrived or retrieval has failed. Await this before reading 'toolConfigs',
// 'presenterConfigs' or 'cookbookConfigs'. Resolves rather than rejects on failure, because the failure is already
// shown and the caller's own load then fails with its own message.
export async function useConfigsReady(): Promise<void> {
    await until(() => configStatus.value.typeId !== 'pending').toBe(true);
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Configuration ─ Modules sent by the config monitor.
export const configStatus = shallowRef<RetrievalStatus>({ typeId: 'pending' });
export const connectorConfigs = shallowRef<ConnectorConfig[]>([]);
export const cookbookConfigs = shallowRef<CookbookConfig[]>([]);
export const engineConfig = shallowRef<EngineConfig | undefined>();
export const eventQueryConfigs = shallowRef<EventQueryConfig[]>([]);
export const presenterConfigs = shallowRef<PresenterConfig[]>([]);
export const toolConfigs = shallowRef<ToolConfig[]>([]);

// ── Account ─ The signed-in account's connections, sent by the account monitor. Pending again after sign-out or a
// dropped connection, because the list cannot be trusted until the next message arrives.
export const accountConfigStatus = shallowRef<RetrievalStatus>({ typeId: 'pending' });
export const connectionAccountConfigs = shallowRef<ConnectionAccountConfig[]>([]);

// ── Context ─ Has its own status because it does not come through the config monitor yet. See
// 'initialiseContextConfig'.
export const contextConfigStatus = shallowRef<RetrievalStatus>({ typeId: 'pending' });
export const contextConfig = shallowRef<ContextConfig | undefined>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// One connection for each connector that needs no sign-in, plus the account's own connections. A connector the account
// has connected more than once numbers its later connections, '(2)' onwards, so they can be told apart.
export const connectionConfigs = computed<ConnectionConfig[]>(() => {
    const configs: ConnectionConfig[] = [];

    for (const connectorConfig of connectorConfigs.value) {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-optional-chain -- TODO: These appear to be wrong, need to check actual input. The types are not guaranteed to match the actual data.
        if (connectorConfig.implementations.default && connectorConfig.implementations.default.authMethodId === 'none') configs.push(constructConnectionConfig(connectorConfig));
    }

    const connectionCountsByConnectorId = new Map<string, number>();
    for (const connectionAccountConfig of connectionAccountConfigs.value) {
        const connectorConfig = connectorConfigs.value.find((config) => config.id === connectionAccountConfig.connectorId);
        if (connectorConfig == null) continue;
        const connectionNumber = (connectionCountsByConnectorId.get(connectorConfig.id) ?? 0) + 1;
        connectionCountsByConnectorId.set(connectorConfig.id, connectionNumber);
        configs.push(constructConnectionConfig(connectorConfig, connectionAccountConfig.id, connectionNumber));
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
        // Shown by each screen that needs the configuration, as when the config monitor gives up, not at app level.
        const failure = raiseFailure(
            new AppError('Failed to load the configuration service.', 'dpuse-app.configs.initialiseConfigMonitor', { typeId: 'handled' }, { cause: error }),
            {
                capability: 'configuration'
            }
        );
        configStatus.value = { typeId: 'failed', failure };
    }
}

// TODO: Replace the body below with a real fetch once the endpoint exists — e.g.
// 'contextConfig.value = (await (await fetch('/api/context-config')).json()) as ContextConfig;' — and drop
// 'contextConfigData' and the artificial delay, which only stand in for that.
export async function initialiseContextConfig(): Promise<void> {
    try {
        await promiseTimeout(400); // Simulates network latency until the real fetch exists.
        contextConfig.value = contextConfigData as ContextConfig;
        contextConfigStatus.value = { typeId: 'ready' };
    } catch (error) {
        const failure = raiseFailure(
            new AppError('Failed to load the context configuration.', 'dpuse-app.configs.initialiseContextConfig', { typeId: 'handled' }, { cause: error }),
            {
                capability: 'context'
            }
        );
        contextConfigStatus.value = { typeId: 'failed', failure };
    }
}

// Undefined when no id is given, or the connection has gone.
export function findConnectionLocalisedConfig(connectionId: string | undefined): LocalisedConfig<ConnectionConfig> | undefined {
    return connectionId == null ? undefined : connectionLocalisedConfigs.value.find((config) => config.id === connectionId);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A connector that needs no sign-in has one connection, known by the connector's own id.
function constructConnectionConfig(connectorConfig: ConnectorConfig, id = connectorConfig.id, connectionNumber = 1): ConnectionConfig {
    const label =
        connectionNumber === 1
            ? connectorConfig.label
            : Object.fromEntries(Object.entries(connectorConfig.label).map(([localeId, text]) => [localeId, `${text} (${String(connectionNumber)})`]));
    return {
        id,
        description: connectorConfig.description,
        authorisation: {},
        connectorConfig,
        firstCreatedAt: null,
        icon: connectorConfig.icon,
        iconDark: connectorConfig.iconDark,
        lastVerifiedAt: 0,
        lastUpdatedAt: null,
        label,
        notation: undefined,
        status: null,
        statusId: connectorConfig.statusId,
        typeId: 'connectorConnection'
    };
}
