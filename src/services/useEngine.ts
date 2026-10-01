// ── DPUse Framework
// import type { DataViewConfig } from '@dpuse/dpuse-shared';
// import type { ConnectionConfig, RetrieveRecordsOptions } from '@dpuse/dpuse-shared';
// import type { AuditObjectContentOptions, ConnectionConfig, PreviewObjectOptions, RetrieveRecordsOptions } from '@dpuse/dpuse-shared';
import { AppError } from '@dpuse/dpuse-shared';
import type { EngineCallbackData, EngineRuntime, EngineWorker } from '@dpuse/dpuse-shared';

// ── Local Framework
import { raiseFailure } from '@/state/errors';
import { throwOnFault } from '@/observability/faultInjection';
import { engineConfig, toolConfigs } from '@/state/session';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENGINE_STORAGE_URL_PREFIX = 'https://engine-eu.dpuse.app';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const state: { activeEngineVersion: string | undefined; pendingEngineWorker: Promise<EngineWorker> | undefined } = {
    activeEngineVersion: undefined,
    pendingEngineWorker: undefined
};

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useEngine(): Promise<EngineWorker> {
    // "useEngine" is not invoked until all modules have been registered in session. So "engineConfig" will be populated.
    const engineVersion = engineConfig.value?.version;

    // Return current value if previously imported and a new version has not been published.
    if (state.pendingEngineWorker != null && state.activeEngineVersion === engineVersion) return state.pendingEngineWorker;

    // The load is cached as a promise rather than as the worker it resolves to, and cached before anything awaits.
    // Callers arrive together — two watchers on 'activeMetaStoreConnectionConfig' call this in the same flush on a
    // refresh — and a cache written only once the load finished would still be empty for the second of them. That
    // gave a second worker, with its own connector instances against the same store.
    const pendingEngineWorker = loadEngine(engineVersion);
    state.activeEngineVersion = engineVersion;
    state.pendingEngineWorker = pendingEngineWorker;

    // A rejected promise stays rejected, so a cached one would replay the original failure to every retry instead of
    // loading again. The identity check leaves a newer load alone, in case the version changed while this one failed.
    void pendingEngineWorker.catch(() => {
        if (state.pendingEngineWorker === pendingEngineWorker) state.pendingEngineWorker = undefined;
    });

    return pendingEngineWorker;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadEngine(engineVersion: string | undefined): Promise<EngineWorker> {
    // Import engine and initialise interface. Reported here rather than left to the caller: every data operation in
    // the app funnels through this one load, most call sites have no failure path of their own, and the failure is
    // the same one whoever triggered it — so this is the single place that can guarantee it reaches the console,
    // Axiom and the UI. Callers that do catch may report again with their own context; the cause chain still carries
    // this error, so the two reports agree.
    const engineURL = `${ENGINE_STORAGE_URL_PREFIX}/engine_v${String(engineVersion)}/dpuse-engine.es.js`;
    let engineWorker: EngineWorker;
    try {
        if (import.meta.env.DEV) throwOnFault('engine');
        const module = await import(/* @vite-ignore */ engineURL);
        const engineRuntime = module.engineRuntime as EngineRuntime;
        engineWorker = engineRuntime.invokeWorker((errorEvent: ErrorEvent) => {
            console.error(errorEvent, 'engineWorker@useEngine.1');
        });
        await engineWorker.initialise({ connectorStorageURLPrefix: `${ENGINE_STORAGE_URL_PREFIX}/connectors`, toolConfigs: toolConfigs.value });
    } catch (error) {
        // Raised to report it, not to display it: this knows the engine failed but not what the user was doing, and
        // every caller is inside a region that does. Each of them shows this as the cause of its own failure — the
        // same loss described in the words of whatever it prevented — and the de-duplication in 'deliverReport' keeps
        // that to one report however many regions were waiting on this load.
        const data = { engineURL, engineVersion, typeId: 'handled' };
        const appError = new AppError(`Failed to load engine v${String(engineVersion)}.`, 'dpuse-app.useEngine.useEngine', data, { cause: error });
        raiseFailure(appError, { capability: 'engine' });
        throw appError;
    }
    if (import.meta.env.DEV) console.info(`[dpuse:app] ✅  Engine 'dpuse-engine' v${String(engineVersion)} loaded.`);

    /**/
    async function streamCsvToConsole(): Promise<void> {
        /** */
        // const FILE_PATH = '/ENGAGEMENT_START_EVENTS_202405121858.csv'; //  '/ENGAGEMENT_START_EVENTS_202405121858.csv' or '/WDI_Data.csv'
        // const LATEST_FILE_STORE_EMULATOR_VERSION = '0.2.454';
        // const connectionConfig = {
        //     id: 'dpuse-connector-file-store-emulator',
        //     description: {},
        //     authorisation: {},
        //     connectorConfig: {
        //         id: 'dpuse-connector-file-store-emulator',
        //         label: { 'en': '' },
        //         description: { 'en': '...' },
        //         category: null,
        //         categoryId: 'database',
        //         implementations: { default: { authMethodId: 'none' } },
        //         icon: '',
        //         iconDark: '',
        //         lastUpdatedAt: null,
        //         operations: [],
        //         status: null,
        //         statusId: 'alpha',
        //         typeId: 'connector',
        //         vendorAccountURL: null,
        //         vendorDocumentationURL: null,
        //         vendorHomeURL: null,
        //         version: LATEST_FILE_STORE_EMULATOR_VERSION
        //     },
        //     lastVerifiedAt: 0,
        //     label: { 'en': '' },
        //     icon: '',
        //     iconDark: '',
        //     lastUpdatedAt: null,
        //     notation: '',
        //     status: null,
        //     statusId: 'alpha',
        //     typeId: 'connectorConnection'
        // } satisfies ConnectionConfig;
        /** */
        // console.log('RETRIEVE RECORDS');
        // const retrieveRecordsOptions: RetrieveRecordsOptions = { encodingId: 'utf-8', path: FILE_PATH, valueDelimiterId: ',' };
        // const startTime1 = performance.now();
        // await engineWorker.processRequest('retrieveRecords', connectionConfig, retrieveRecordsOptions, (data: EngineCallbackData) => {
        //     if (data && data.typeId === 'complete') console.log('RETRIEVE RECORDS - RESULT', data.properties.summary);
        // });
        // const elapsedTime1 = performance.now() - startTime1;
        // console.log('RETRIEVE RECORDS - ELAPSED', elapsedTime1, `${(elapsedTime1 / 1000).toFixed(2)}s.`);
        //     /** */
        //     console.log('PREVIEW OBJECT');
        //     const startTime2 = performance.now();
        //     const previewObjectOptions: PreviewObjectOptions = { path: FILE_PATH };
        //     const previewObjectResult = (await engineWorker.processRequest('previewObject', connectionConfig, previewObjectOptions)) as DataViewConfig;
        //     const elapsedTime2 = performance.now() - startTime2;
        //     console.log('PREVIEW OBJECT - RESULT', previewObjectResult);
        //     console.log('PREVIEW OBJECT - ELAPSED', elapsedTime2, `${(elapsedTime2 / 1000).toFixed(2)}s.`);
        //     /** */
        //     // const auditContentOptions: PreviewObjectOptions = { path: FILE_PATH };
        //     // const xxxx = await engineWorker.processRequest('auditContent', connectionConfig, auditContentOptions);
        //     // console.log('xxxx', xxxx);
        //     /** */
        //     console.log('AUDIT OBJECT CONTENT JS');
        //     const startTime3 = performance.now();
        //     const auditObjectContentOptions: AuditObjectContentOptions = {
        //         chunkSize: 4096,
        //         encodingId: 'utf-8',
        //         path: FILE_PATH,
        //         valueDelimiterId: ','
        //     };
        //     const auditObjectContentResult = await engineWorker.processRequest('auditObjectContent', connectionConfig, auditObjectContentOptions);
        //     const elapsedTime3 = performance.now() - startTime3;
        //     console.log('AUDIT OBJECT CONTENT JS - RESULT', auditObjectContentResult);
        //     console.log('AUDIT OBJECT CONTENT JS - ELAPSED', elapsedTime3, `${(elapsedTime3 / 1000).toFixed(2)}s.`);
        //     /** */
        //     console.log('AUDIT OBJECT CONTENT RUST');
        //     const startTime4 = performance.now();
        //     const auditObjectContentOptionsRust: AuditObjectContentOptions = {
        //         chunkSize: 4096,
        //         encodingId: 'utf-8',
        //         parsingToolName: 'dpuse-tool-rust-csv-core-parser',
        //         path: FILE_PATH,
        //         valueDelimiterId: ','
        //     };
        //     const auditObjectContentResultRust = await engineWorker.processRequest('auditObjectContent', connectionConfig, auditObjectContentOptionsRust);
        //     const elapsedTime4 = performance.now() - startTime4;
        //     console.log('AUDIT OBJECT CONTENT RUST - RESULT', auditObjectContentResultRust);
        //     console.log('AUDIT OBJECT CONTENT RUST - ELAPSED', elapsedTime4, `${(elapsedTime4 / 1000).toFixed(2)}s.`);
    }

    void streamCsvToConsole().catch((error: unknown) => {
        console.error('Failed to start stream:', error);
    });
    /**/

    return engineWorker;
}
