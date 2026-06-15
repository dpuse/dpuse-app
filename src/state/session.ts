// External Dependencies & Registrations
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';
import { computed, ref, shallowRef, watch } from 'vue';

// DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import type { ContextConfig } from '@dpuse/dpuse-shared/component/module/context';
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { DimensionConfig } from '@dpuse/dpuse-shared/component/dimension';
import type { EngineConfig } from '@dpuse/dpuse-shared/engine';
import type { EventQueryConfig } from '@dpuse/dpuse-shared/component/eventQuery';
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';

// Local (App) Framework
import { localeId } from './locale';
import { reportAppError } from '@/observability/errorTracking';
import { forgetUser, identifyUser } from '@/observability/eventTracking';
import { type LocaleId, localiseConfig, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Types ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ConnectionAccountConfig {
    connectorId: string;
}

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const EXPIRE_INTERVAL_FAST = 1000; // Milliseconds (1 second).
const EXPIRE_INTERVAL_SLOW = 60_000; // Milliseconds (1 minute).
const HANKO_API_URL = import.meta.env.PROD ? import.meta.env.VITE_HANKO_API_URL_PROD : import.meta.env.VITE_HANKO_API_URL_DEV;
const LOCAL_META_NODE_CONNECTOR_ID = 'dpuse-connector-dexie-js';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const areUpdatesPending = ref(false);
export const accountId = ref<string | undefined>();
export const emailAddress = ref<string | undefined>();
const emailIsPrimary = ref<boolean | undefined>();
const emailIsVerified = ref<boolean | undefined>();
export const expiresAt = ref<number | undefined>();
export const expiresIn = ref<number | undefined>();
let expiryTimer: ReturnType<typeof setTimeout> | undefined; // Long-lived authenticated-session-scoped expiry timer.
let hankoInstance: Hanko | undefined; // Long-lived module-scoped Hanko instance reused across multiple authentication sessions.
let hankoFlowCleanupFunction: (() => void) | undefined; // Short lived session scoped cleanup callback for the active Hanko flow.
export const isAuthenticated = ref<boolean | undefined>(); // Undefined if Hanko session validation pending; false if signed OUT; true if signed IN.
export const lifetime = ref<number | undefined>();
const sessionId = ref<string | undefined>();

// State - Configuration ───────────────────────────────────────────────────────────────────────────────────────────────

export const connectionAccountConfigs = shallowRef<ConnectionAccountConfig[]>([]);
export const connectorConfigs = shallowRef<ConnectorConfig[]>([]);
export const contextConfig = shallowRef<ContextConfig | undefined>();
export const dataViewConfigs = shallowRef<DataViewConfig[]>([]);
export const engineConfig = shallowRef<EngineConfig | undefined>();
export const eventQueryConfigs = shallowRef<EventQueryConfig[]>([]);
export const dimensionConfigs = shallowRef<DimensionConfig[]>([]);
export const presenterConfigs = shallowRef<PresenterConfig[]>([]);
export const toolConfigs = shallowRef<ToolConfig[]>([]);

// Derived State - Connection Configurations ───────────────────────────────────────────────────────────────────────────

export const connectionConfigs = computed<ConnectionConfig[]>(() => {
    const configs: ConnectionConfig[] = [];

    for (const connectorConfig of connectorConfigs.value!) {
        if (connectorConfig.implementations.default.authMethodId === 'none') configs.push(constructConnectionConfig(connectorConfig));
    }

    for (const accountConfigs of connectionAccountConfigs.value) {
        const connectorConfig = connectorConfigs.value.find((config) => config.id === accountConfigs.connectorId);
        if (connectorConfig != null) {
            configs.push(constructConnectionConfig(connectorConfig));
        }
    }

    return configs;
});

export const activeMetaStoreConnectionConfig = computed(() => {
    const metaNodeConnectorConfig: ConnectorConfig | undefined = connectorConfigs.value.find((connectorConfig) => connectorConfig.id === LOCAL_META_NODE_CONNECTOR_ID);
    return metaNodeConnectorConfig ? constructConnectionConfig(metaNodeConnectorConfig) : undefined;
});

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(areUpdatesPending, (newAreUpdatesPending) => {
    if (newAreUpdatesPending) {
        globalThis.addEventListener('beforeunload', handleBeforeUnload);
    } else {
        globalThis.removeEventListener('beforeunload', handleBeforeUnload);
    }
});

watch(
    localeId,
    (newLocaleId) => {
        console.log('### Locale:', newLocaleId);
    },
    { immediate: true }
);

// Side Effects - Connection Configurations ────────────────────────────────────────────────────────────────────────────

// watch(activeMetaStoreConnectionConfig, () => (dataViewConfigs.value = []), { immediate: true }); // TODO: Should we make this conditional?

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialiseServices(): void {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    import('@teamhanko/hanko-frontend-sdk').then(({ Hanko }) => {
        hankoInstance = new Hanko(HANKO_API_URL);
        hankoInstance.onSessionCreated((sessionDetails) => establishSession('created', sessionDetails.claims));
        hankoInstance.onSessionExpired(() => establishSession('expired'));
        hankoInstance.onUserDeleted(() => establishSession('deleted'));
        hankoInstance.onUserLoggedOut(() => establishSession('terminated'));
        hankoInstance
            .validateSession()
            .then((result) => {
                establishSession('validated', result.is_valid ? result.claims : undefined);
                import('@/observability/performanceTracking').then((module) => module.initialise());
            })
            .catch((error) => {
                reportAppError(new AppError('Session validation failed.', 'dpuse.sessionStore.useSessionStore.initialiseServices', { typeId: 'handled' }, { cause: error }));
                establishSession('validationFailure');
            });
    });
    import('@/observability/configMonitor').then((module) => module.initialise());
}

export async function constructFlow(name: FlowName, stateHandler: ({ state }: { state: AnyState }) => void): Promise<void> {
    hankoFlowCleanupFunction = hankoInstance?.onAfterStateChange(stateHandler);
    await hankoInstance?.createState(name);
}

export function destroyFlow(): void {
    hankoFlowCleanupFunction?.();
    hankoFlowCleanupFunction = undefined;
}

export function getLocalisedConnection(id: string | undefined, localeId: LocaleId): LocalisedConfig<ConnectionConfig> | undefined {
    const connectionConfig = connectionConfigs.value.find((connectionConfig) => connectionConfig.id === id);
    if (connectionConfig == null) return;
    return localiseConfig<ConnectionConfig>(connectionConfig, localeId);
}

export function setSessionExpiryTimer(runQuickly: boolean = false): void {
    clearSessionExpiryTimer();
    if (runQuickly && expiresAt.value != null) {
        expiresIn.value = Math.max(0, expiresAt.value - Date.now());
    }
    expiryTimer = globalThis.setInterval(
        () => {
            expiresIn.value = Math.max(0, (expiresAt.value ?? 0) - Date.now());
            if (expiresIn.value <= 0) clearSessionExpiryTimer();
        },
        runQuickly ? EXPIRE_INTERVAL_FAST : EXPIRE_INTERVAL_SLOW
    );
}

export async function signOut(): Promise<void> {
    await hankoInstance?.logout();
}

// UI Handlers ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleBeforeUnload(event: BeforeUnloadEvent): void {
    event.preventDefault();
    event.returnValue = '';
}

function handleVisibilityChange(): void {
    if (document.visibilityState !== 'visible' || expiresAt.value == null) return;
    expiresIn.value = Math.max(0, expiresAt.value - Date.now());
    if (expiresIn.value <= 0) clearSessionExpiryTimer();
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function clearSessionExpiryTimer(): void {
    globalThis.clearInterval(expiryTimer);
    expiryTimer = undefined;
}

function constructConnectionConfig(connectorConfig: ConnectorConfig): ConnectionConfig {
    return {
        id: connectorConfig.id,
        description: {},
        authorisation: {},
        connectorConfig,
        firstCreatedAt: null,
        icon: connectorConfig.icon,
        iconDark: connectorConfig.iconDark,
        iconNeutral: connectorConfig.iconNeutral,
        lastVerifiedAt: 0,
        lastUpdatedAt: null,
        label: connectorConfig.label,
        notation: undefined,
        status: null,
        statusId: connectorConfig.statusId,
        typeId: 'connectorConnection'
    };
}

function establishSession(actionId: 'created' | 'expired' | 'deleted' | 'terminated' | 'validated' | 'validationFailure', claims?: Claims): void {
    if (claims) {
        if (claims.email) {
            emailAddress.value = claims.email.address;
            emailIsPrimary.value = claims.email.is_primary;
            emailIsVerified.value = claims.email.is_verified;
        } else {
            emailAddress.value = emailAddress.value;
            emailIsPrimary.value = undefined;
            emailIsVerified.value = undefined;
        }
        accountId.value = claims.subject;
        const establishedAt = claims.issued_at == null ? 0 : Date.parse(claims?.issued_at);
        expiresAt.value = claims.expiration ? Date.parse(claims.expiration) : 0;
        expiresIn.value = Math.max(0, (expiresAt.value || 0) - Date.now());
        isAuthenticated.value = true;
        lifetime.value = expiresAt.value - establishedAt;
        sessionId.value = claims.session_id;

        import('@/observability/accountMonitor').then((module) => module.initialise());

        setSessionExpiryTimer();
        identifyUser(claims.subject, claims.session_id, claims.email?.address ?? emailAddress.value);

        if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Authenticated session established (${actionId}).`);
    } else {
        forgetUser();
        clearSessionExpiryTimer();

        import('@/observability/accountMonitor').then((module) => module.terminate());

        connectionAccountConfigs.value = [];
        emailAddress.value = undefined;
        emailIsPrimary.value = undefined;
        emailIsVerified.value = undefined;
        expiresAt.value = undefined;
        expiresIn.value = undefined;
        isAuthenticated.value = false;
        lifetime.value = undefined;
        accountId.value = undefined;
        sessionId.value = undefined;

        const icon = actionId === 'validationFailure' ? '⚠️' : 'ℹ️';
        if (import.meta.env.DEV) console.info(`[dpuse:app] ${icon} Unauthenticated session established (${actionId}).`);
    }
}
