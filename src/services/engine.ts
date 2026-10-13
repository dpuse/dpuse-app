// ── DPUse Framework
// import type { DataViewConfig } from '@dpuse/dpuse-shared';
// import type { ConnectionConfig, RetrieveRecordsOptions } from '@dpuse/dpuse-shared';
// import type { AuditObjectContentOptions, ConnectionConfig, PreviewObjectOptions, RetrieveRecordsOptions } from '@dpuse/dpuse-shared';
import { AppError } from '@dpuse/dpuse-shared';
import type { EngineRuntime, EngineWorker } from '@dpuse/dpuse-shared';

// ── Local Framework
import { raiseFailure } from '@/state/errors';
import { throwOnFault } from '@/observability/faultInjection';
import { assertDefined, shareLoad } from '@/utilities/index.ts';
import { engineConfig, toolConfigs, useConfigsReady } from '@/state/configs';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENGINE_STORAGE_URL_PREFIX = 'https://engine-eu.dpuse.app';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The first engine loaded stays for the life of the page, even after a newer version is deployed, because a second
// worker would open its own connectors against the same stores. The user picks up the new version by reloading.
export const establishEngineWorker = shareLoad(loadEngineWorker);

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Every data operation waits on this one load, and most callers have no failure path of their own, so its failure is
// reported here.
async function loadEngineWorker(): Promise<EngineWorker> {
    await useConfigsReady();
    const engineVersion = engineConfig.value?.version;
    const engineURL = `${ENGINE_STORAGE_URL_PREFIX}/engine_v${String(engineVersion)}/dpuse-engine.es.js`;
    let engineWorker: EngineWorker;
    try {
        if (import.meta.env.DEV) throwOnFault('engine');
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
