/* eslint-disable unicorn/prefer-add-event-listener */

// Vendor dependencies
import type { Claims } from '@teamhanko/hanko-frontend-sdk';
import { ref } from 'vue';

// Application core
type ModuleStatesController = { connect: () => void; disconnect: () => void };
type MonitorController = { init: () => void };

let moduleStates: ModuleStatesController | undefined;
let monitor: MonitorController | undefined;
let worker: Worker | undefined;
const workerReady = ref(false);

export function useEventWorker() {
    return { init, postEvent, workerReady };
}

async function init(sessionClaims?: Claims): Promise<void> {
    await Promise.all([startWorker(sessionClaims), ensureModuleStates(), ensureMonitor()]);
}

function postEvent(payload: unknown): void {
    worker?.postMessage({ type: 'event', payload });
}

async function startWorker(sessionClaims?: Claims): Promise<void> {
    if (!worker) {
        worker = new Worker(new URL('../workers/eventWorker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (event) => {
            console.debug('[event-worker]', event.data);
        };
    }
    worker.postMessage({ type: 'session:init', payload: sessionClaims });
    workerReady.value = true;
}

async function ensureModuleStates(): Promise<void> {
    if (moduleStates) return;
    const moduleStatesComposable = await import('@/composables/useModuleStates');
    moduleStates = moduleStatesComposable.useModuleStates();
    moduleStates.connect();
    if (globalThis.window !== undefined) {
        window.addEventListener('beforeunload', moduleStates.disconnect);
    }
}

async function ensureMonitor(): Promise<void> {
    if (monitor) return;
    const monitorComposable = await import('@/composables/useMonitor');
    monitor = monitorComposable.useMonitor();
    monitor.init();
}
