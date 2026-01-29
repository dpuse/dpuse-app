/* eslint-disable unicorn/prefer-add-event-listener */

// Vendor dependencies
import type { Claims } from '@teamhanko/hanko-frontend-sdk';
import { ref } from 'vue';
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { useWorkbenchContext } from './useWorkbenchContext';

// Application core
type WorkerResponse = { type: string; payload?: unknown; meta?: { requestId?: number } };

let worker: Worker | undefined;
let beforeUnloadRegistered = false;
let requestCounter = 0;
const pendingEvents = new Map<number, (value: unknown) => void>();
const workerReady = ref(false);

// Composable
export function useEventWorker() {
    return { init, postEvent, workerReady };
}

// Operations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function init(sessionClaims?: Claims): Promise<void> {
    await startWorker(sessionClaims);
    setupBeforeUnload();
}

function postEvent(payload: unknown): Promise<unknown> {
    if (!worker) {
        throw new Error('Event worker is not initialised. Call init() first.');
    }
    const requestId = ++requestCounter;
    return new Promise((resolve) => {
        pendingEvents.set(requestId, resolve);
        worker?.postMessage({ type: 'event', payload, meta: { requestId } });
    });
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function startWorker(sessionClaims?: Claims): Promise<void> {
    if (!worker) {
        worker = new Worker(new URL('@/workers/eventWorker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = handleWorkerMessage;
    }
    worker.postMessage({ type: 'session:init', payload: sessionClaims });
    workerReady.value = true;

    const defaultPayload = useWorkbenchContext();
    onCLS((metric) => logEvent(metric, { ...defaultPayload, clsDelta: metric.delta, clsValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
    onINP((metric) => logEvent(metric, { ...defaultPayload, inpDelta: metric.delta, inpValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
    onLCP((metric) => logEvent(metric, { ...defaultPayload, lcpDelta: metric.delta, lcpValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
    onFCP((metric) => logEvent(metric, { ...defaultPayload, fcpDelta: metric.delta, fcpValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
    onTTFB((metric) => logEvent(metric, { ...defaultPayload, ttfbDelta: metric.delta, ttfbValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
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
    // fetch('https://eu.posthog.com/capture/', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //         api_key: 'phc_lsZySXoMlZsSR2dvvUgW0miyzOZvSilsh6i7SC2qYOs',
    //         event: 'web_vitals',
    //         distinct_id: 'anonymous_' + Math.random().toString(36).substring(2, 10),
    //         properties: {
    //             page_url: globalThis.location.href,
    //             device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    //             connection_type: (navigator as any).connection?.effectiveType || 'unknown',
    //             ...data,
    //             timestamp: Date.now()
    //         }
    //     })
    // }).catch(console.error);
}

function setupBeforeUnload(): void {
    if (beforeUnloadRegistered || globalThis.window === undefined) return;
    window.addEventListener('beforeunload', handleBeforeUnload);
    beforeUnloadRegistered = true;
}

function handleBeforeUnload(): void {
    worker?.postMessage({ type: 'session:teardown' });
}

function handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { type, payload, meta } = event.data || {};

    if (type === 'event:result' && meta?.requestId !== undefined) {
        const resolver = pendingEvents.get(meta.requestId);
        if (resolver) {
            resolver(payload);
            pendingEvents.delete(meta.requestId);
        }
    }

    console.debug('[event-worker]', event.data);
}
