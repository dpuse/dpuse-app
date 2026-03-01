// App core
import { version } from '~/package.json';

// Constants
const DPU_API_HOST = 'api.datapos.app';

// Tracked identity for event attribution
let activeSessionId: string | undefined;
let activeUserId: string | undefined;
const pendingEvents: Record<string, unknown>[] = [];

setInterval(flushEvents, 5000);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushEvents();
});

async function flushEvents(): Promise<void> {
    if (pendingEvents.length === 0) return;
    navigator.sendBeacon(`https://${DPU_API_HOST}/events`, JSON.stringify({ events: pendingEvents.splice(0), userAgentString: navigator.userAgent })); // Fails silently if browser cannot queue request
}

type EventTypeId = 'error' | 'interaction' | 'page' | 'performance';
export function trackEvent(typeId: EventTypeId, data: Record<string, unknown>): void {
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

export function identifyUser(userId: string, sessionId: string, emailAddress?: string): void {
    activeUserId = userId;
    activeSessionId = sessionId;
}

export function forgetUser(): void {
    activeUserId = undefined;
    activeSessionId = undefined;
}
