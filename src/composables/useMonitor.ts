/* eslint-disable unicorn/prefer-add-event-listener */

// Vendor dependencies
import type { Claims } from '@teamhanko/hanko-frontend-sdk';
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

type WorkerResponse = { type: string; payload?: unknown; meta?: { requestId?: number } };

let worker: Worker | undefined;

//
let messageId = 0;
const pendingMessageMap = new Map<number, (value: unknown) => void>();

// Composable
export function useMonitor() {
    return { cleanUp, identifyUser, initialise, postEvent };
}

// Operations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initialise(): void {
    startWorker();
}

function identifyUser(sessionClaims?: Claims): void {
    if (!worker) startWorker();
    worker?.postMessage({ type: 'identifyUser', payload: sessionClaims });
}

function postEvent(payload: { name: string; data: Record<string, unknown> }): Promise<unknown> {
    if (!worker) startWorker();
    const requestId = ++messageId;
    return new Promise((resolve) => {
        pendingMessageMap.set(requestId, resolve);
        worker?.postMessage({ type: 'event', payload, meta: { requestId } });
    });
}

function cleanUp() {
    if (!worker) return;
    worker.postMessage({ type: 'cleanUp' });
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function startWorker(): void {
    worker = new Worker(new URL('@/workers/monitorWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, payload, meta } = event.data || {};

        if (type === 'event:result' && meta?.requestId !== undefined) {
            const resolver = pendingMessageMap.get(meta.requestId);
            if (resolver) {
                resolver(payload);
                pendingMessageMap.delete(meta.requestId);
            }
        }

        console.debug('[event-worker]', event.data);
    };

    worker.postMessage({ type: 'initialise', payload: undefined });

    // Must be run on main thread
    const userAgent = navigator.userAgent;
    onCLS((metric) => postWebVitalsEvent(metric, userAgent));
    onINP((metric) => postWebVitalsEvent(metric, userAgent));
    onLCP((metric) => postWebVitalsEvent(metric, userAgent));
    onFCP((metric) => postWebVitalsEvent(metric, userAgent));
    onTTFB((metric) => postWebVitalsEvent(metric, userAgent));
}

function postWebVitalsEvent(metric: Metric, userAgent: string) {
    try {
        const data = {
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
        };
        postEvent(data);
    } catch (error) {
        console.log(1111, error);
        console.log(2222, metric);
        console.log(3333, userAgent);
    }
}
