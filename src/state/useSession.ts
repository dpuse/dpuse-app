// External Dependencies
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';
import { ref, shallowRef } from 'vue';

// DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { EngineConfig } from '@dpuse/dpuse-shared/engine';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/tool';
import type { ConnectionConfig, ConnectorConfig } from '@dpuse/dpuse-shared/component/connector';
import type { ContextConfig, PresenterConfig } from '@dpuse/dpuse-shared';

// App Core
import { reportAppError } from '@/observability/errorTracking';
import { forgetUser, identifyUser } from '@/observability/eventTracking';

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const EXPIRE_INTERVAL_FAST = 1000; // Milliseconds (1 second).
const EXPIRE_INTERVAL_SLOW = 300_000; // Milliseconds (5 minutes).
const HANKO_API_URL = import.meta.env.PROD ? import.meta.env.VITE_HANKO_API_URL_PROD : import.meta.env.VITE_HANKO_API_URL_DEV;

// Long-lived module-scoped Hanko instance reused across multiple authentication sessions.
let hankoInstance: Hanko | undefined;

// Short lived session scoped cleanup callback for the active Hanko flow.
let hankoFlowCleanupFunction: (() => void) | undefined;

// Long-lived authenticated-session-scoped expiry timer.
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const areUpdatesPending = ref(false);
const connectionConfigs = shallowRef<ConnectionConfig[]>([]);
const connectorConfigs = shallowRef<ConnectorConfig[] | undefined>();
const contextConfig = shallowRef<ContextConfig | undefined>();
const dataViewConfigs = shallowRef<{ id: string; label: string }[] | undefined>();
const dimensionConfigs = shallowRef<{ id: string; label: string }[] | undefined>();
const emailAddress = ref<string | undefined>();
const emailIsPrimary = ref<boolean | undefined>();
const emailIsVerified = ref<boolean | undefined>();
const engineConfig = shallowRef<EngineConfig | undefined>();
const expiresAt = ref<number | undefined>();
const expiresIn = ref<number | undefined>();
const eventQueryConfigs = shallowRef<{ id: string; label: string }[] | undefined>();
const isAuthenticated = ref<boolean | undefined>(); // Undefined if Hanko session validation pending; false if signed OUT; true if signed IN.
const lifetime = ref<number | undefined>();
const localMetaStoreConnectionConfig = shallowRef<ConnectionConfig | undefined>();
const presenterConfigs = shallowRef<PresenterConfig[] | undefined>();
const sessionId = ref<string | undefined>();
const toolConfigs = shallowRef<ToolConfig[] | undefined>();
const userId = ref<string | undefined>();

// Initialisation ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

globalThis.addEventListener('beforeunload', (event) => {
    if (!areUpdatesPending.value) return;
    event.preventDefault();
    event.returnValue = '';
});

// watch(
//     localMetaStoreConnectionConfig,
//     (newConnectionConfig) => {
//         // console.log(1111, newConnectionConfig);
//     },
//     { immediate: true }
// );

// Session Composable ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const session = {
    connectionConfigs,
    connectorConfigs,
    contextConfig,
    constructFlow,
    dataViewConfigs,
    destroyFlow,
    dimensionConfigs,
    emailAddress,
    engineConfig,
    expiresAt,
    expiresIn,
    eventQueryConfigs,
    initialiseServices,
    isAuthenticated,
    lifetime,
    localMetaStoreConnectionConfig,
    presenterConfigs,
    signOut,
    toolConfigs
};
export function useSession(): typeof session {
    return session;
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initialiseServices(): void {
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

async function constructFlow(name: FlowName, stateHandler: ({ state }: { state: AnyState }) => void): Promise<void> {
    hankoFlowCleanupFunction = hankoInstance?.onAfterStateChange(stateHandler);
    await hankoInstance?.createState(name);
}

function destroyFlow(): void {
    hankoFlowCleanupFunction?.();
    hankoFlowCleanupFunction = undefined;
}

async function signOut(): Promise<void> {
    await hankoInstance?.logout();
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
