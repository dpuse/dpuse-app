// ── API Framework
import { version } from '~/package.json';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DPUSE_API_HOST = 'api.dpuse.app';
const FLUSH_INTERVAL_INITIAL = 5000;
const FLUSH_INTERVAL_SUBSEQUENT = 30_000;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const state: { activeSessionId: string | undefined; activeUserId: string | undefined; flushInterval: number } = {
    activeSessionId: undefined, // Tracked session identity for event attribution.
    activeUserId: undefined, // Tracked user identity for event attribution.
    flushInterval: FLUSH_INTERVAL_INITIAL
};
const pendingEvents: Record<string, unknown>[] = [];

// ── Initialisation ───────────────────────────────────────────────────────────────────────────────────────────────────

// This module is an app-lifetime singleton: the flush timer and visibility listener are registered once at import
// and shared by every consumer, not tied to any one component's lifecycle, so they intentionally live at the top level.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
setInterval(flushEvents, state.flushInterval);
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    flushEvents();
    state.flushInterval = FLUSH_INTERVAL_SUBSEQUENT; // First check is 5secs after load, subsequent checks are every 30secs.
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function forgetUser(): void {
    state.activeUserId = undefined;
    state.activeSessionId = undefined;
}

// TODO: Change to 'accountId'?
export function identifyUser(userId: string, sessionId: string, emailAddress?: string): void {
    state.activeUserId = userId;
    state.activeSessionId = sessionId;
}

export function trackEvent(typeId: 'error' | 'interaction' | 'page' | 'performance', data: Record<string, unknown>): void {
    pendingEvents.push({
        typeId,
        asAt: Date.now(),
        appVersion: version,
        sessionId: state.activeSessionId,
        userId: state.activeUserId,
        spanId: undefined,
        referrer: document.referrer,
        url: location.href,
        ...data
    });
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function flushEvents(): Promise<void> {
    if (pendingEvents.length === 0) return;
    const events = [...pendingEvents];
    pendingEvents.length = 0;
    navigator.sendBeacon(`https://${DPUSE_API_HOST}/events`, JSON.stringify({ events, userAgentString: navigator.userAgent })); // Fails silently if browser cannot queue request
}
