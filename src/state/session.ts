// ── External Dependencies & Registrations
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';
import { computed, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import type { ContextConfig } from '@dpuse/dpuse-shared/component/context';
import type { CookbookConfig } from '@dpuse/dpuse-shared/component/module/cookbook';
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
// True once configMonitor's initial WebSocket handshake has been processed — distinct from any one config array
// being non-empty, since a freshly connected session's config arrays start empty (busy) rather than confirmed-empty.
// Await 'useConfigsReady' rather than watching this directly when loading a tool, presenter or cookbook.
export const configRetrievalSucceeded = ref(false);
// True once configMonitor has exhausted its reconnect attempts without ever completing the handshake above — lets
// the UI show a real "couldn't connect" message instead of leaving every config list stuck in its busy state
// forever. Reset to false as soon as a connection attempt succeeds.
export const configRetrievalFailed = ref(false);
// True once a service module has failed to load — the Hanko SDK, the account monitor, or the engine. Every one of
// those is a stale-deployment or offline-network failure that only a page reload can clear, so a single flag drives
// a single banner rather than one flag and one message per service. Configuration retrieval keeps its own flag
// because that one also has to release the awaits gated on it.
export const serviceLoadFailed = ref(false);
// True once accountMonitor has delivered at least one message for the current session. Cleared on sign-out
// alongside connectionAccountConfigs, since neither is meaningful while signed out.
export const accountConfigsAreRetrieved = ref(false);

// ── Derived State - Connection Configurations ────────────────────────────────────────────────────────────────────────

export const connectionConfigs = computed<ConnectionConfig[]>(() => {
    const configs: ConnectionConfig[] = [];

    for (const connectorConfig of connectorConfigs.value) {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-optional-chain -- TODO: These appear to be wrong, need to check actual input. The types are not guaranteed to match the actual data.
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

export function setSessionExpiryTimer(isRunQuickly = false): void {
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
    // eslint-disable-next-line sonarjs/deprecation, @typescript-eslint/no-deprecated -- This is still required
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
    let hankoModule;
    try {
        hankoModule = await import('@teamhanko/hanko-frontend-sdk');
    } catch (error) {
        // Without this the session stays 'undefined' — pending — forever, so every session-dependent view waits on a
        // validation that can never run. 'validationFailure' settles it as signed out, exactly as a rejected validate would.
        serviceLoadFailed.value = true;
        establishSession('validationFailure');
        void reportAppError(new AppError('Failed to load the authentication service.', 'dpuse-app.session.initialiseHanko', { typeId: 'handled' }, { cause: error }));
        return;
    }

    state.hankoInstance = new hankoModule.Hanko(HANKO_API_URL);
    state.hankoInstance.onSessionCreated((sessionDetails) => {
        establishSession('created', sessionDetails.claims);
    });
    state.hankoInstance.onSessionExpired(() => {
        establishSession('expired');
    });
    state.hankoInstance.onUserDeleted(() => {
        establishSession('deleted');
    });
    state.hankoInstance.onUserLoggedOut(() => {
        establishSession('terminated');
    });
    try {
        const result = await state.hankoInstance.validateSession();
        establishSession('validated', result.is_valid ? result.claims : undefined);
        void initialisePerformanceTracking();
    } catch (error) {
        void reportAppError(new AppError('Session validation failed.', 'dpuse.sessionStore.useSessionStore.initialiseServices', { typeId: 'handled' }, { cause: error }));
        establishSession('validationFailure');
    }
}

async function initialiseConfigMonitor(): Promise<void> {
    try {
        const configMonitorModule = await import('@/observability/configMonitor');
        configMonitorModule.initialise();
    } catch (error) {
        // Marked as failed rather than as a generic service load failure: without it neither retrieval flag is ever
        // set, so every 'useConfigsReady' await hangs and each configuration list stays busy with no explanation.
        // The flag also drives the banner, so this failure is surfaced by the same route as a failed handshake.
        configRetrievalFailed.value = true;
        void reportAppError(new AppError('Failed to load the configuration service.', 'dpuse-app.session.initialiseConfigMonitor', { typeId: 'handled' }, { cause: error }));
    }
}

// Reported to the console and Axiom but deliberately not surfaced: performance tracking is invisible telemetry, so
// its absence changes nothing the user can see or act on and a banner would be noise.
async function initialisePerformanceTracking(): Promise<void> {
    try {
        const performanceTrackingModule = await import('@/observability/performanceTracking');
        performanceTrackingModule.initialise();
    } catch (error) {
        void reportAppError(new AppError('Failed to load performance tracking.', 'dpuse-app.session.initialisePerformanceTracking', { typeId: 'handled' }, { cause: error }));
    }
}

async function initialiseAccountMonitor(): Promise<void> {
    try {
        const accountMonitorModule = await import('@/observability/accountMonitor');
        accountMonitorModule.initialise();
    } catch (error) {
        // 'accountConfigsAreRetrieved' stays false, so connection lists would otherwise sit busy indefinitely.
        serviceLoadFailed.value = true;
        void reportAppError(new AppError('Failed to load the account service.', 'dpuse-app.session.initialiseAccountMonitor', { typeId: 'handled' }, { cause: error }));
    }
}

// Not surfaced: the module is already resident by the time sign-out runs, and a skipped teardown in a tab that is
// discarding its session state is not something the user can act on.
async function terminateAccountMonitor(): Promise<void> {
    try {
        const accountMonitorModule = await import('@/observability/accountMonitor');
        accountMonitorModule.terminate();
    } catch (error) {
        void reportAppError(new AppError('Failed to terminate the account service.', 'dpuse-app.session.terminateAccountMonitor', { typeId: 'handled' }, { cause: error }));
    }
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
        const establishedAt = claims.issued_at == null ? 0 : Date.parse(claims.issued_at);
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
        accountConfigsAreRetrieved.value = false;
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
