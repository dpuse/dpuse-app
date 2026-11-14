// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { EngineRuntime, EngineWorker } from '@dpuse/dpuse-shared';

// ── Local Framework
import { raiseFailure } from '@/state/errors';
import { assertDefined, shareLoad } from '@/utilities/index.ts';
import { engineConfig, toolConfigs, useConfigsReady } from '@/state/configs';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENGINE_STORAGE_URL_PREFIX = 'https://engine-eu.dpuse.app';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The first engine loaded stays for the life of the page, even after a newer version is deployed, because a second
// worker would open its own connectors against the same stores. The user picks up the new version by reloading. In
// development, Vite runs this module again when it or a module it imports changes. The new copy takes over the running
// engine, because one it started itself would find the stores held by the first and report them open in another tab.
export const establishEngineWorker = (import.meta.hot?.data.establishEngineWorker as (() => Promise<EngineWorker>) | undefined) ?? shareLoad(loadEngineWorker);
if (import.meta.hot) import.meta.hot.data.establishEngineWorker = establishEngineWorker;

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Every data operation waits on this one load, and most callers have no failure path of their own, so its failure is
// reported here.
async function loadEngineWorker(): Promise<EngineWorker> {
    await useConfigsReady();
    const engineVersion = engineConfig.value?.version;
    const engineURL = `${ENGINE_STORAGE_URL_PREFIX}/engine_v${String(engineVersion)}/dpuse-engine.es.js`;
    let engineWorker: EngineWorker;
    try {
        assertDefined(engineVersion, 'No engine configuration.');
        const module = await import(/* @vite-ignore */ engineURL);
        const engineRuntime = module.engineRuntime as EngineRuntime;
        engineWorker = engineRuntime.invokeWorker((errorEvent: ErrorEvent) => {
            const workerError = new AppError('Engine worker failed.', 'dpuse-app.engine.loadEngineWorker', { engineVersion, typeId: 'handled' }, { cause: errorEvent.error ?? errorEvent.message });
            raiseFailure(workerError, { capability: 'engine' });
        });
        await engineWorker.initialise({
            connectorStorageURLPrefix: `${ENGINE_STORAGE_URL_PREFIX}/connectors`,
            isLogged: import.meta.env.DEV,
            toolConfigs: toolConfigs.value
        });
    } catch (error) {
        // Raised to report it, not to display it. Each waiting caller shows it as the cause of its own failure, and
        // 'deliverReport' sends it only once.
        const data = { engineURL, engineVersion, typeId: 'handled' };
        const appError = new AppError(`Failed to load engine v${String(engineVersion)}.`, 'dpuse-app.engine.loadEngineWorker', data, { cause: error });
        raiseFailure(appError, { capability: 'engine' });
        throw appError;
    }
    if (import.meta.env.DEV) console.info(`[dpuse:app] ✅  Engine 'dpuse-engine' v${String(engineVersion)} loaded.`);

    return engineWorker;
}
