/* eslint-disable unicorn/consistent-function-scoping */

// External dependencies
import { defineStore } from 'pinia';
import { useIdle } from '@vueuse/core';
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';
import { type ComponentPublicInstance, ref, shallowRef, watch } from 'vue';

// DPU framework
import type { EngineConfig } from '@datapos/datapos-shared/engine';
import type { ToolConfig } from '@datapos/datapos-shared/component/tool';
import type { ConnectionConfig, ConnectorConfig } from '@datapos/datapos-shared/component/connector';
import type { ContextConfig, PresenterConfig } from '@datapos/datapos-shared';

// App core
import type { Monitor } from '@/composables/useMonitor';

// Exception declarations
type HandledException = { typeId: 'handled'; payload: { error?: unknown; locator: string } };
type UnhandledVueException = { typeId: 'unhandledVue'; payload: { error?: unknown; instance: ComponentPublicInstance | null; info?: string } };
type UnhandledRuntimeException = { typeId: 'unhandledRuntime'; payload: ErrorEvent };
type UnhandledPromiseRejectException = { typeId: 'unhandledPromise'; payload: PromiseRejectionEvent };
export type Exception = HandledException | UnhandledRuntimeException | UnhandledPromiseRejectException | UnhandledVueException;

// Constants
const EXPIRE_INTERVAL_FAST = 1000; // Milliseconds (1 second).
const EXPIRE_INTERVAL_SLOW = 300_000; // Milliseconds (5 minutes).
const HANKO_API_URL = import.meta.env.PROD ? import.meta.env.VITE_HANKO_API_URL_PROD : import.meta.env.VITE_HANKO_API_URL_DEV;
const SESSION_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Long-lived module-scoped Hanko instance reused across multiple authentication sessions
let hankoInstance: Hanko | undefined;

// Short lived session scoped cleanup callback for the active Hanko flow
let hankoFlowCleanupFunction: (() => void) | undefined;

// Long-lived app-scoped monitor instance
export let monitorInstance: Monitor | undefined;

// Short lived app-scoped startup pending exceptions array
export const pendingExceptions: Exception[] = [];

// Long-lived authenticated-session-scoped expiry timer
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

// Pina store for session state
export const useSessionStore = defineStore('session', () => {
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
    const isAuthenticated = ref<boolean | undefined>(); // undefined if Hanko validate session pending; false if signed OUT; true if signed IN
    const lifetime = ref<number | undefined>();
    const localMetaStoreConnectionConfig = shallowRef<ConnectionConfig | undefined>();
    const presenterConfigs = shallowRef<PresenterConfig[] | undefined>();
    const sessionId = ref<string | undefined>();
    const toolConfigs = shallowRef<ToolConfig[] | undefined>();
    const userId = ref<string | undefined>();

    const { idle, lastActive } = useIdle(SESSION_IDLE_TIMEOUT);

    watch(
        localMetaStoreConnectionConfig,
        (newConnectionConfig) => {
            console.log(1111, newConnectionConfig);
        },
        { immediate: true }
    );

    function initialiseServices(): void {
        import('@teamhanko/hanko-frontend-sdk').then(({ Hanko }) => {
            hankoInstance = new Hanko(HANKO_API_URL);
            hankoInstance.onSessionCreated((sessionDetails) => establishSession('created', sessionDetails.claims));
            hankoInstance.onSessionExpired(() => establishSession('expired'));
            hankoInstance.onUserDeleted(() => establishSession('deleted'));
            hankoInstance.onUserLoggedOut(() => establishSession('terminated'));
            hankoInstance.validateSession().then((result) => {
                establishSession('validated', result.is_valid ? result.claims : undefined, true);
                import('@/composables/useMonitor').then((module) => {
                    monitorInstance = module.useMonitor(userId.value, sessionId.value, emailAddress.value);
                    window.addEventListener('beforeunload', (event) => {
                        if (!areUpdatesPending.value) return;
                        monitorInstance?.shutdown(); // Fails silently in no monitor instance
                        event.preventDefault();
                        event.returnValue = '';
                    });
                });
            });
        });
    }

    function constructFlow(name: FlowName, stateHandler: ({ state }: { state: AnyState }) => void): void {
        hankoFlowCleanupFunction = hankoInstance?.onAfterStateChange(stateHandler); // Fails silently in no Hanko instance
        hankoInstance?.createState(name);
    }

    function destroyFlow(): void {
        hankoFlowCleanupFunction?.(); // Fails silently in no Hanko flow cleanup function
        hankoFlowCleanupFunction = undefined;
    }

    async function signOut(): Promise<void> {
        await hankoInstance?.logout(); // Fails silently in no Hanko instance
    }

    return {
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
        idle,
        initialiseServices,
        isAuthenticated,
        lastActive,
        lifetime,
        localMetaStoreConnectionConfig,
        presenterConfigs,
        signOut,
        toolConfigs
    };

    // Establish session helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    function establishSession(reasonId: string, claims?: Claims, isLoading = false): void {
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
            if (import.meta.env.DEV) console.info(`[dpu:app] ℹ️ Authenticated session established (${reasonId}).`);
            startSessionExpiryTimer();
            if (!isLoading) monitorInstance?.identifyUser(claims.subject, claims.session_id, claims.email?.address ?? emailAddress.value); // Fails silently in no monitor instance
        } else {
            monitorInstance?.resetUser(); // Fails silently in no monitor instance
            clearSessionExpiryTimer();
            emailAddress.value = undefined;
            emailIsPrimary.value = undefined;
            emailIsVerified.value = undefined;
            expiresAt.value = undefined;
            expiresIn.value = undefined;
            isAuthenticated.value = false;
            lifetime.value = undefined;
            userId.value = undefined;
            sessionId.value = undefined;
            if (import.meta.env.DEV) console.info(`[dpu:app] ℹ️ Unauthenticated session established (${reasonId}).`);
        }
    }

    // Session expiry timer helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
});
