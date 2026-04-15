// App Framework
import { version } from '~/package.json';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const DPUSE_API_HOST = 'api.dpuse.app';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

let activeSessionId: string | undefined; // Tracked session identity for event attribution.
let activeUserId: string | undefined; // Tracked user identity for event attribution.
const pendingEvents: Record<string, unknown>[] = [];
let timeout = 5000;

// Initialisation ──────────────────────────────────────────────────────────────────────────────────────────────────────

setInterval(flushEvents, timeout);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    flushEvents();
    timeout = 30_000; // First check is 5secs after load, subsequent checks are every 30secs.
});

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function forgetUser(): void {
    activeUserId = undefined;
    activeSessionId = undefined;
}

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
        url: globalThis.location.href,
        ...data
    });
}

// Helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────────

async function flushEvents(): Promise<void> {
    if (pendingEvents.length === 0) return;
    navigator.sendBeacon(`https://${DPUSE_API_HOST}/events`, JSON.stringify({ events: pendingEvents.splice(0), userAgentString: navigator.userAgent })); // Fails silently if browser cannot queue request
}
