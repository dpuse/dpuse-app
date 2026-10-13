// ── External Dependencies & Registrations
import { ref } from 'vue';
import { useEventListener, useIntervalFn } from '@vueuse/core';

// ── Local Framework
import { version } from '~/package.json';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type EventTypeId = 'error' | 'interaction' | 'page' | 'performance';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const DPUSE_API_HOST = 'api.dpuse.app';
const FLUSH_INTERVAL_INITIAL = 5000;
const FLUSH_INTERVAL_SUBSEQUENT = 30_000;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const flushInterval = ref(FLUSH_INTERVAL_INITIAL);
const state: { currentSessionId: string | undefined; currentUserId: string | undefined } = {
    currentSessionId: undefined,
    currentUserId: undefined
};
const pendingEvents: Record<string, unknown>[] = [];

// ── Initialisation ───────────────────────────────────────────────────────────────────────────────────────────────────

// This module is an app-lifetime singleton: the flush timer and visibility listener are registered once at import
// and shared by every consumer, not tied to any one component's lifecycle, so they intentionally live at the top level.
//
// The first flush is 5 seconds after load and later ones every 30 seconds; 'useIntervalFn' restarts on the new interval.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
useIntervalFn(() => {
    flushEvents();
    flushInterval.value = FLUSH_INTERVAL_SUBSEQUENT;
}, flushInterval);
// A hidden tab may never come back, so whatever is queued is sent while it still can be.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- see comment above
useEventListener(document, 'visibilitychange', () => {
    if (document.hidden) flushEvents();
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function forgetUser(): void {
    state.currentUserId = undefined;
    state.currentSessionId = undefined;
}

export function identifyUser(userId: string, sessionId: string, _emailAddress?: string): void {
    state.currentUserId = userId;
    state.currentSessionId = sessionId;
}

// Queues the event for the next periodic/visibilitychange flush. Use for anything that doesn't need delivery confirmed.
export function trackEvent(typeId: EventTypeId, data: Record<string, unknown>): void {
    pendingEvents.push(buildEvent(typeId, data));
}

// TODO: Outbox, so no report is lost to an unload or a network failure. Save each event to IndexedDB before sending it,
// delete it once the API answers 'ok', and resend whatever is left on the next app start, as Sentry's
// 'makeBrowserOfflineTransport' does. Cap the outbox so an unreachable API cannot fill the browser's storage.
//
// Sends immediately, bypassing the batch queue, and reports whether delivery succeeded. Use when the caller needs to
// confirm the event actually reached the server (e.g. to inform the user).
// eslint-disable-next-line unicorn/consistent-boolean-name -- primarily performs the send; the boolean is a secondary delivery-confirmation result.
export async function trackEventImmediately(typeId: EventTypeId, data: Record<string, unknown>): Promise<boolean> {
    try {
        const response = await fetch(`https://${DPUSE_API_HOST}/events`, {
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: [buildEvent(typeId, data)], userAgentString: navigator.userAgent })
        });
        return response.ok;
    } catch {
        return false;
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildEvent(typeId: EventTypeId, data: Record<string, unknown>): Record<string, unknown> {
    return {
        typeId,
        asAt: Date.now(),
        appVersion: version,
        sessionId: state.currentSessionId,
        userId: state.currentUserId,
        spanId: undefined,
        referrer: document.referrer,
        url: location.href,
        ...data
    };
}

function flushEvents(): void {
    if (pendingEvents.length === 0) return;
    const events = [...pendingEvents];
    pendingEvents.length = 0;
    const isQueued = navigator.sendBeacon(`https://${DPUSE_API_HOST}/events`, JSON.stringify({ events, userAgentString: navigator.userAgent }));
    if (!isQueued) pendingEvents.unshift(...events); // The browser refused the beacon, so the events wait for the next flush.
}
