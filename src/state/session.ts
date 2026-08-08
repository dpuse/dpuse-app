// ── External Dependencies & Registrations
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';
import { computed, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import type { ContextConfig } from '@dpuse/dpuse-shared/component/context';
import type { CookbookConfig } from '@dpuse/dpuse-shared/component/module/cookbook';
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { DimensionConfig } from '@dpuse/dpuse-shared/component/dimension';
import type { EngineConfig } from '@dpuse/dpuse-shared/component/module/engine';
import type { EventQueryConfig } from '@dpuse/dpuse-shared/component/eventQuery';
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';
import { type LocaleId, localiseConfig, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { localeId } from './locale';
import { reportAppError } from '@/observability/errorTracking';
import { forgetUser, identifyUser } from '@/observability/eventTracking';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ConnectionAccountConfig {
    connectorId: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const EXPIRE_INTERVAL_FAST = 1000; // Milliseconds (1 second).
const EXPIRE_INTERVAL_SLOW = 60_000; // Milliseconds (1 minute).
const HANKO_API_URL = import.meta.env.PROD ? import.meta.env.VITE_HANKO_API_URL_PROD : import.meta.env.VITE_HANKO_API_URL_DEV;
const LOCAL_META_NODE_CONNECTOR_ID = 'dpuse-connector-dexie-js';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const accountId = ref<string | undefined>();
export const emailAddress = ref<string | undefined>();
const emailIsPrimary = ref<boolean | undefined>();
const emailIsVerified = ref<boolean | undefined>();
export const expiresAt = ref<number | undefined>();
export const expiresIn = ref<number | undefined>();
const state: { expiryTimer: ReturnType<typeof setTimeout> | undefined; hankoInstance: Hanko | undefined; hankoFlowCleanupFunction: (() => void) | undefined } = {
    expiryTimer: undefined, // Long-lived authenticated-session-scoped expiry timer.
    hankoInstance: undefined, // Long-lived module-scoped Hanko instance reused across multiple authentication sessions.
    hankoFlowCleanupFunction: undefined // Short lived session scoped cleanup callback for the active Hanko flow.
};
export const sessionIsAuthenticated = ref<boolean | undefined>(); // Undefined if Hanko session validation pending; false if signed OUT; true if signed IN.
export const lifetime = ref<number | undefined>();
const sessionId = ref<string | undefined>();
const updatesArePending = ref(false);

// ── State - Configuration ────────────────────────────────────────────────────────────────────────────────────────────

export const connectionAccountConfigs = shallowRef<ConnectionAccountConfig[]>([]);
export const connectorConfigs = shallowRef<ConnectorConfig[]>([]);
export const contextConfig = shallowRef<ContextConfig | undefined>();
export const cookbookConfigs = shallowRef<CookbookConfig[]>([]);
export const engineConfig = shallowRef<EngineConfig | undefined>();
export const eventQueryConfigs = shallowRef<EventQueryConfig[]>([]);
export const dimensionConfigs = shallowRef<DimensionConfig[]>([]);
export const presenterConfigs = shallowRef<PresenterConfig[]>([]);
export const toolConfigs = shallowRef<ToolConfig[]>([]);

// ── Derived State - Connection Configurations ────────────────────────────────────────────────────────────────────────

export const connectionConfigs = computed<ConnectionConfig[]>(() => {
    const configs: ConnectionConfig[] = [];

    for (const connectorConfig of connectorConfigs.value!) {
        if (connectorConfig.implementations.default && connectorConfig.implementations.default.authMethodId === 'none') configs.push(constructConnectionConfig(connectorConfig));
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

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// This module is an app-lifetime singleton: watchers are registered once at import and shared by every consumer,
// not tied to any one component's lifecycle, so they intentionally live at the top level rather than in a hook.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
watch(updatesArePending, (newAreUpdatesPending) => {
    if (newAreUpdatesPending) {
        addEventListener('beforeunload', handleBeforeUnload);
    } else {
        removeEventListener('beforeunload', handleBeforeUnload);
    }
});

// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
watch(
    localeId,
    (newLocaleId) => {
        console.log('### Locale:', newLocaleId);
    },
    { immediate: true }
);

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialiseServices(): void {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    void initialiseHanko();
    void initialiseConfigMonitor();
}

export async function constructFlow(name: FlowName, stateHandler: ({ state }: { state: AnyState }) => void): Promise<void> {
    state.hankoFlowCleanupFunction = state.hankoInstance?.onAfterStateChange(stateHandler);
    await state.hankoInstance?.createState(name);
}

export function destroyFlow(): void {
    state.hankoFlowCleanupFunction?.();
    state.hankoFlowCleanupFunction = undefined;
}

export function getLocalisedConnection(id: string | undefined, localeId: LocaleId): LocalisedConfig<ConnectionConfig> | undefined {
    const connectionConfig = connectionConfigs.value.find((connectionConfig) => connectionConfig.id === id);
    if (connectionConfig == null) return;
    return localiseConfig<ConnectionConfig>(connectionConfig, localeId);
}

export function setSessionExpiryTimer(isRunQuickly: boolean = false): void {
    clearSessionExpiryTimer();
    if (isRunQuickly && expiresAt.value != null) {
        expiresIn.value = Math.max(0, expiresAt.value - Date.now());
    }
    state.expiryTimer = setInterval(
        () => {
            expiresIn.value = Math.max(0, (expiresAt.value ?? 0) - Date.now());
            if (expiresIn.value <= 0) clearSessionExpiryTimer();
        },
        isRunQuickly ? EXPIRE_INTERVAL_FAST : EXPIRE_INTERVAL_SLOW
    );
}

export async function signOut(): Promise<void> {
    await state.hankoInstance?.logout();
}

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleBeforeUnload(event: BeforeUnloadEvent): void {
    event.preventDefault();
    event.returnValue = '';
}

function handleVisibilityChange(): void {
    if (document.visibilityState !== 'visible' || expiresAt.value == null) return;
    expiresIn.value = Math.max(0, expiresAt.value - Date.now());
    if (expiresIn.value <= 0) clearSessionExpiryTimer();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function clearSessionExpiryTimer(): void {
    clearInterval(state.expiryTimer);
    state.expiryTimer = undefined;
}

async function initialiseHanko(): Promise<void> {
    const { Hanko } = await import('@teamhanko/hanko-frontend-sdk');
    state.hankoInstance = new Hanko(HANKO_API_URL);
    state.hankoInstance.onSessionCreated((sessionDetails) => establishSession('created', sessionDetails.claims));
    state.hankoInstance.onSessionExpired(() => establishSession('expired'));
    state.hankoInstance.onUserDeleted(() => establishSession('deleted'));
    state.hankoInstance.onUserLoggedOut(() => establishSession('terminated'));
    try {
        const result = await state.hankoInstance.validateSession();
        establishSession('validated', result.is_valid ? result.claims : undefined);
        void initialisePerformanceTracking();
    } catch (error) {
        reportAppError(new AppError('Session validation failed.', 'dpuse.sessionStore.useSessionStore.initialiseServices', { typeId: 'handled' }, { cause: error }));
        establishSession('validationFailure');
    }
}

async function initialiseConfigMonitor(): Promise<void> {
    const configMonitorModule = await import('@/observability/configMonitor');
    configMonitorModule.initialise();
}

async function initialisePerformanceTracking(): Promise<void> {
    const performanceTrackingModule = await import('@/observability/performanceTracking');
    performanceTrackingModule.initialise();
}

async function initialiseAccountMonitor(): Promise<void> {
    const accountMonitorModule = await import('@/observability/accountMonitor');
    accountMonitorModule.initialise();
}

async function terminateAccountMonitor(): Promise<void> {
    const accountMonitorModule = await import('@/observability/accountMonitor');
    accountMonitorModule.terminate();
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
        sessionIsAuthenticated.value = true;
        lifetime.value = expiresAt.value - establishedAt;
        sessionId.value = claims.session_id;

        void initialiseAccountMonitor();

        setSessionExpiryTimer();
        identifyUser(claims.subject, claims.session_id, claims.email?.address ?? emailAddress.value);

        if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️  Authenticated session established (${actionId}).`);
    } else {
        forgetUser();
        clearSessionExpiryTimer();

        void terminateAccountMonitor();

        connectionAccountConfigs.value = [];
        emailAddress.value = undefined;
        emailIsPrimary.value = undefined;
        emailIsVerified.value = undefined;
        expiresAt.value = undefined;
        expiresIn.value = undefined;
        sessionIsAuthenticated.value = false;
        lifetime.value = undefined;
        accountId.value = undefined;
        sessionId.value = undefined;

        const icon = actionId === 'validationFailure' ? '⚠️ ' : 'ℹ️ ';
        if (import.meta.env.DEV) console.info(`[dpuse:app] ${icon} Unauthenticated session established (${actionId}).`);
    }
}
