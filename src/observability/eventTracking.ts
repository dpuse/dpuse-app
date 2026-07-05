// ── Local (App) Framework
import { version } from '~/package.json';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DPUSE_API_HOST = 'api.dpuse.app';
const FLUSH_INTERVAL_INITIAL = 5000;
const FLUSH_INTERVAL_SUBSEQUENT = 30_000;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

let activeSessionId: string | undefined; // Tracked session identity for event attribution.
let activeUserId: string | undefined; // Tracked user identity for event attribution.
const pendingEvents: Record<string, unknown>[] = [];
let flushInterval = FLUSH_INTERVAL_INITIAL;

// ── Initialisation ───────────────────────────────────────────────────────────────────────────────────────────────────

setInterval(flushEvents, flushInterval);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    flushEvents();
    flushInterval = FLUSH_INTERVAL_SUBSEQUENT; // First check is 5secs after load, subsequent checks are every 30secs.
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function forgetUser(): void {
    activeUserId = undefined;
    activeSessionId = undefined;
}

// TODO: Change to 'accountId'?
export function identifyUser(userId: string, sessionId: string, emailAddress?: string): void {
    activeUserId = userId;
    activeSessionId = sessionId;
}

export function trackEvent(typeId: 'error' | 'interaction' | 'page' | 'performance', data: Record<string, unknown>): void {
    pendingEvents.push({
        typeId,
        asAt: Date.now(),
        appVersion: version,
        sessionId: activeSessionId,
        userId: activeUserId,
        spanId: undefined,
        referrer: document.referrer,
        url: location.href,
        ...data
    });
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function flushEvents(): Promise<void> {
    if (pendingEvents.length === 0) return;
    navigator.sendBeacon(`https://${DPUSE_API_HOST}/events`, JSON.stringify({ events: pendingEvents.splice(0), userAgentString: navigator.userAgent })); // Fails silently if browser cannot queue request
}
