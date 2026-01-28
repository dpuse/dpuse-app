// External dependencies
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AnyState, Claims, FlowName, Hanko } from '@teamhanko/hanko-frontend-sdk';
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// import { useStatesMessenger } from '../composables/useStateMessenger';
// import { useWorkbenchContext } from '@/composables/useWorkbenchContext';

// Constants
const EXPIRE_INTERVAL_FAST = 1000; // Milliseconds (1 second).
const EXPIRE_INTERVAL_SLOW = 300_000; // Milliseconds (5 minutes).
const HANKO_API_URL = import.meta.env.PROD ? import.meta.env.VITE_HANKO_API_URL_PROD : import.meta.env.VITE_HANKO_API_URL_DEV;

interface SessionStatus {
    establishedAt?: number;
    expiresAt?: number;
    expiresIn?: number;
    isAuthenticated?: boolean;
    lifetime?: number;
    sessionId?: string;
    userId?: string;
}
let flowCleanupFunction: (() => void) | undefined;
let hankoInstance: Hanko | undefined;
const sessionStatus = ref<SessionStatus>({});
// const { connect, disconnect } = useStatesMessenger();
let sessionExpiryTimer: ReturnType<typeof setTimeout> | undefined;

// Pina store for session state
export const useSessionStore = defineStore('session', () => {
    // connect();
    // initServices(); // TODO: Maybe establishSession
    // window.addEventListener('beforeunload', disconnect);

    return { constructFlow, destroyFlow, initServices, sessionStatus, signOut };
});
async function initServices(): Promise<void> {
    console.log(1111);
    const hankoModule = await import('@teamhanko/hanko-frontend-sdk');
    hankoInstance = new hankoModule.Hanko(HANKO_API_URL);
    hankoInstance.onSessionCreated((sessionDetails) => (sessionStatus.value = constructSessionStatus(sessionDetails.claims)));
    hankoInstance.onSessionExpired(() => (sessionStatus.value = constructSessionStatus()));
    hankoInstance.onUserDeleted(() => (sessionStatus.value = constructSessionStatus()));
    hankoInstance.onUserLoggedOut(() => (sessionStatus.value = constructSessionStatus()));

    const validateSessionResponse = await hankoInstance.validateSession();
    sessionStatus.value = constructSessionStatus(validateSessionResponse.is_valid ? validateSessionResponse.claims : undefined);

    // const defaultPayload = useWorkbenchContext();
    // onCLS((metric) => logEvent(metric, { ...defaultPayload, clsDelta: metric.delta, clsValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
    // onINP((metric) => logEvent(metric, { ...defaultPayload, inpDelta: metric.delta, inpValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
    // onLCP((metric) => logEvent(metric, { ...defaultPayload, lcpDelta: metric.delta, lcpValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
    // onFCP((metric) => logEvent(metric, { ...defaultPayload, fcpDelta: metric.delta, fcpValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
    // onTTFB((metric) => logEvent(metric, { ...defaultPayload, ttfbDelta: metric.delta, ttfbValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
}

async function logEvent(metric: Metric, data: Record<string, unknown>) {
    console.log({
        api_key: 'phc_stFCVM7oIBMHqRDgAkxA7yQq5jbV3SpQfFOTazKGwiq',
        event: 'web_vitals',
        properties: {
            page_url: globalThis.location.href,
            device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            connection_type: (navigator as any).connection?.effectiveType || 'unknown',
            ...data,
            timestamp: Date.now()
        }
    });
    fetch('https://eu.posthog.com/capture/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: 'phc_lsZySXoMlZsSR2dvvUgW0miyzOZvSilsh6i7SC2qYOs',
            event: 'web_vitals',
            distinct_id: 'anonymous_' + Math.random().toString(36).substring(2, 10),
            properties: {
                page_url: globalThis.location.href,
                device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
                connection_type: (navigator as any).connection?.effectiveType || 'unknown',
                ...data,
                timestamp: Date.now()
            }
        })
    }).catch(console.error);
}

function constructFlow(name: FlowName, stateHandler: ({ state }: { state: AnyState }) => void): void {
    flowCleanupFunction = hankoInstance?.onAfterStateChange(stateHandler);
    hankoInstance?.createState(name);
}

function destroyFlow(): void {
    flowCleanupFunction?.();
}

async function signOut(): Promise<void> {
    await hankoInstance?.logout();
}

function clearSessionExpiryTimer(): void {
    clearInterval(sessionExpiryTimer);
    sessionExpiryTimer = undefined;
}

// function startSessionExpiryTimer(runQuickly: boolean = false): void {
//     clearSessionExpiryTimer();
//     sessionExpiryTimer = setInterval(
//         () => {
//             sessionStatus.value.expiresIn = Math.max(0, (sessionStatus.value.expiresAt || 0) - Date.now());
//             if (sessionStatus.value.expiresIn === 0) clearSessionExpiryTimer();
//         },
//         runQuickly ? EXPIRE_INTERVAL_FAST : EXPIRE_INTERVAL_SLOW
//     );
// }

//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//#region Authentication Helpers
//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function constructSessionStatus(claims?: Claims): SessionStatus {
    if (claims) {
        const establishedAt = claims.issued_at ? Date.parse(claims?.issued_at) : 0;
        const expiresAt = claims.expiration ? Date.parse(claims.expiration) : 0;
        return {
            establishedAt,
            expiresAt,
            expiresIn: 0,
            isAuthenticated: true,
            lifetime: expiresAt - establishedAt,
            sessionId: claims.session_id ?? undefined,
            userId: claims.subject
        };
    }
    return { isAuthenticated: false };
}

//#endregion ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
