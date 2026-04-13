// External Dependencies
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';
import { ref, shallowRef, watch } from 'vue';

// DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { EngineConfig } from '@dpuse/dpuse-shared/engine';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/tool';
import type { ConnectionConfig, ConnectorConfig } from '@dpuse/dpuse-shared/component/connector';
import type { ContextConfig, DimensionConfig, EventQueryConfig, PresenterConfig } from '@dpuse/dpuse-shared';

// App Core
import { localeId } from '../translations';
import { reportAppError } from '@/observability/errorTracking';
import { forgetUser, identifyUser } from '@/observability/eventTracking';

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const EXPIRE_INTERVAL_FAST = 1000; // Milliseconds (1 second).
const EXPIRE_INTERVAL_SLOW = 300_000; // Milliseconds (5 minutes).
const HANKO_API_URL = import.meta.env.PROD ? import.meta.env.VITE_HANKO_API_URL_PROD : import.meta.env.VITE_HANKO_API_URL_DEV;

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const connectionConfigs = shallowRef<ConnectionConfig[]>([]);
export const connectorConfigs = shallowRef<ConnectorConfig[] | undefined>();
export const contextConfig = shallowRef<ContextConfig | undefined>();
export const dataViewConfigs = shallowRef<DataViewConfig[] | undefined>();
export const dimensionConfigs = shallowRef<DimensionConfig[] | undefined>();
export const emailAddress = ref<string | undefined>();
export const engineConfig = shallowRef<EngineConfig | undefined>();
export const expiresAt = ref<number | undefined>();
export const expiresIn = ref<number | undefined>();
export const eventQueryConfigs = shallowRef<EventQueryConfig[] | undefined>();
export const isAuthenticated = ref<boolean | undefined>(); // Undefined if Hanko session validation pending; false if signed OUT; true if signed IN.
export const lifetime = ref<number | undefined>();
export const localMetaStoreConnectionConfig = shallowRef<ConnectionConfig | undefined>();
export const presenterConfigs = shallowRef<PresenterConfig[] | undefined>();
export const toolConfigs = shallowRef<ToolConfig[] | undefined>();

const areUpdatesPending = ref(false);
const emailIsPrimary = ref<boolean | undefined>();
const emailIsVerified = ref<boolean | undefined>();
const sessionId = ref<string | undefined>();
const userId = ref<string | undefined>();

// Long-lived module-scoped Hanko instance reused across multiple authentication sessions.
let hankoInstance: Hanko | undefined;

// Short lived session scoped cleanup callback for the active Hanko flow.
let hankoFlowCleanupFunction: (() => void) | undefined;

// Long-lived authenticated-session-scoped expiry timer.
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

// Initialisation ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleBeforeUnload(event: BeforeUnloadEvent): void {
    event.preventDefault();
    event.returnValue = '';
}

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

watch(
    localMetaStoreConnectionConfig,
    (newLocalMetaStoreConnectionConfig, oldLocalMetaStoreConnectionConfig) => {
        // console.log('### Local meta store configuration changed to', JSON.stringify(oldLocalMetaStoreConnectionConfig), JSON.stringify(newLocalMetaStoreConnectionConfig));
    },
    { immediate: true }
);

// Actions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function initialiseServices(): void {
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

export async function signOut(): Promise<void> {
    await hankoInstance?.logout();
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
        const establishedAt = claims.issued_at == null ? 0 : Date.parse(claims?.issued_at);
        expiresAt.value = claims.expiration ? Date.parse(claims.expiration) : 0;
        expiresIn.value = Math.max(0, (expiresAt.value || 0) - Date.now());
        isAuthenticated.value = true;
        lifetime.value = expiresAt.value - establishedAt;
        sessionId.value = claims.session_id;
        userId.value = claims.subject;

        import('@/observability/accountMonitor').then((module) => {
            if (userId.value != null) module.initialise(userId.value);
        });

        startSessionExpiryTimer();
        identifyUser(claims.subject, claims.session_id, claims.email?.address ?? emailAddress.value);

        if (import.meta.env.DEV) console.info(`[dpuse:app] ℹ️ Authenticated session established (${actionId}).`);
    } else {
        forgetUser();
        clearSessionExpiryTimer();

        import('@/observability/accountMonitor').then((module) => {
            module.terminate();
        });

        emailAddress.value = undefined;
        emailIsPrimary.value = undefined;
        emailIsVerified.value = undefined;
        expiresAt.value = undefined;
        expiresIn.value = undefined;
        isAuthenticated.value = false;
        lifetime.value = undefined;
        userId.value = undefined;
        sessionId.value = undefined;

        const icon = actionId === 'validationFailure' ? '⚠️' : 'ℹ️';
        if (import.meta.env.DEV) console.info(`[dpuse:app] ${icon} Unauthenticated session established (${actionId}).`);
    }
}

function startSessionExpiryTimer(runQuickly: boolean = false): void {
    clearSessionExpiryTimer();
    expiryTimer = globalThis.setInterval(
        () => {
            expiresIn.value = Math.max(0, (expiresAt.value ?? 0) - Date.now());
            if (expiresIn.value <= 0) clearSessionExpiryTimer();
        },
        runQuickly ? EXPIRE_INTERVAL_FAST : EXPIRE_INTERVAL_SLOW
    );
}

function clearSessionExpiryTimer(): void {
    globalThis.clearInterval(expiryTimer);
    expiryTimer = undefined;
}
