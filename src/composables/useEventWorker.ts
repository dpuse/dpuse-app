/* eslint-disable unicorn/prefer-add-event-listener */

// Vendor dependencies
import type { Claims } from '@teamhanko/hanko-frontend-sdk';
import { ref } from 'vue';

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
