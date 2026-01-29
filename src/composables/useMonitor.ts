/* eslint-disable unicorn/prefer-add-event-listener */

// Vendor dependencies
import type { Claims } from '@teamhanko/hanko-frontend-sdk';
import { ref } from 'vue';
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

type WorkerResponse = { type: string; payload?: unknown; meta?: { requestId?: number } };

let worker: Worker | undefined;
const workerReady = ref(false);

let messageCounter = 0;
const pendingMessageMap = new Map<number, (value: unknown) => void>();

// Composable
export function useMonitor() {
    return { cleanUp, initialise, postEvent, workerReady };
}

// Operations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function initialise(sessionClaims?: Claims): Promise<void> {
    worker = new Worker(new URL('@/workers/monitorWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = handleWorkerMessage;

    worker.postMessage({ type: 'initialise', payload: sessionClaims });
    workerReady.value = true;

    const userAgent = navigator.userAgent;
    onCLS((metric) => postWebVitalsEvent(metric, userAgent));
    onINP((metric) => postWebVitalsEvent(metric, userAgent));
    onLCP((metric) => postWebVitalsEvent(metric, userAgent));
    onFCP((metric) => postWebVitalsEvent(metric, userAgent));
    onTTFB((metric) => postWebVitalsEvent(metric, userAgent));
}

function postWebVitalsEvent(metric: Metric, userAgent: string) {
    postEvent({
        name: 'webVitals',
        data: {
            id: metric.id,
            name: metric.name,
            value: metric.value,
            delta: metric.delta,
            entries: metric.entries.map((entry) => entry.toJSON()),
            navigationType: metric.navigationType,
            rating: metric.rating,
            userAgent
        }
    });
}

function postEvent(payload: { name: string; data: Record<string, unknown> }): Promise<unknown> {
    if (!worker) throw new Error('Event worker is not initialised. Call init() first.');

    const requestId = ++messageCounter;
    return new Promise((resolve) => {
        pendingMessageMap.set(requestId, resolve);
        worker?.postMessage({ type: 'event', payload, meta: { requestId } });
    });
}

function cleanUp() {
    worker?.postMessage({ type: 'cleanUp' });
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { type, payload, meta } = event.data || {};

    if (type === 'event:result' && meta?.requestId !== undefined) {
        const resolver = pendingMessageMap.get(meta.requestId);
        if (resolver) {
            resolver(payload);
            pendingMessageMap.delete(meta.requestId);
        }
    }

    console.debug('[event-worker]', event.data);
}

// async function startWorker(sessionClaims?: Claims): Promise<void> {
//     if (!worker) {
//         worker = new Worker(new URL('@/workers/monitorWorker.ts', import.meta.url), { type: 'module' });
//         worker.onmessage = handleWorkerMessage;
//     }
//     worker.postMessage({ type: 'session:init', payload: sessionClaims });
//     workerReady.value = true;

//     const userAgent = navigator.userAgent;
//     onCLS((metric) => postEvent({ name: 'webVitals', data: { name: metric.name, value: metric.value, delta: metric.delta }, userAgent }));
//     onINP((metric) => postEvent({ name: 'webVitals', data: { name: metric.name, value: metric.value, delta: metric.delta }, userAgent }));
//     onLCP((metric) => postEvent({ name: 'webVitals', data: { name: metric.name, value: metric.value, delta: metric.delta }, userAgent }));
//     onFCP((metric) => postEvent({ name: 'webVitals', data: { name: metric.name, value: metric.value, delta: metric.delta }, userAgent }));
//     onTTFB((metric) => postEvent({ name: 'webVitals', data: { name: metric.name, value: metric.value, delta: metric.delta }, userAgent }));
// }

// function setupBeforeUnload(): void {
//     if (beforeUnloadRegistered || globalThis.window === undefined) return;
//     window.addEventListener('beforeunload', handleBeforeUnload);
//     beforeUnloadRegistered = true;
// }

// function handleBeforeUnload(): void {
//     worker?.postMessage({ type: 'session:teardown' });
// }
