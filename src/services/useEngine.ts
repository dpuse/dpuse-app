// DPUse Framework
// import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
// import type { ConnectionConfig, RetrieveRecordsOptions } from '@dpuse/dpuse-shared/component/connector';
// import type { AuditObjectContentOptions, ConnectionConfig, PreviewObjectOptions, RetrieveRecordsOptions } from '@dpuse/dpuse-shared/component/connector';
import type { EngineCallbackData, EngineRuntime, EngineWorker } from '@dpuse/dpuse-shared/engine';

// App Core
import { engineConfig, toolConfigs } from '@/state/session';

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ENGINE_STORAGE_URL_PREFIX = 'https://engine-eu.dpuse.app';

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let activeEngineVersion: string | undefined;
let engineWorker: EngineWorker | undefined;

// Engine Composable ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function useEngine(): Promise<EngineWorker> {
    // "useEngine" is not invoked until all modules have been registered in session. So "engineConfig" will be populated.
    const engineVersion = engineConfig.value!.version as string;

    // Return current value if previously imported and a new version has not been published.
    if (engineWorker != null && activeEngineVersion === engineVersion) return engineWorker;

    // Import engine and initialise interface.
    const module = await import(/* @vite-ignore */ `${ENGINE_STORAGE_URL_PREFIX}/engine_v${engineVersion}/dpuse-engine.es.js`);
    const engineRuntime = module.engineRuntime as EngineRuntime;
    const pendingEngineWorker = engineRuntime.invokeWorker((errorEvent: ErrorEvent) => {
        console.error(errorEvent, 'engineWorker@useEngine.1');
    });
    await pendingEngineWorker.initialise({ connectorStorageURLPrefix: `${ENGINE_STORAGE_URL_PREFIX}/connectors`, toolConfigs: toolConfigs.value || [] });
    if (import.meta.env.DEV) console.info(`[dpuse:app] ✅ Engine 'dpuse-engine' v${engineVersion} loaded.`);

    /*****/
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
        //         label: { 'en-gb': '' },
        //         description: { 'en-gb': '...' },
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
        //         usageId: 'bidirectional',
        //         vendorAccountURL: null,
        //         vendorDocumentationURL: null,
        //         vendorHomeURL: null,
        //         version: LATEST_FILE_STORE_EMULATOR_VERSION
        //     },
        //     lastVerifiedAt: 0,
        //     label: { 'en-gb': '' },
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
        // const retrieveRecordsOptions: RetrieveRecordsOptions = { encodingId: 'utf8', path: FILE_PATH, valueDelimiterId: ',' };
        // const startTime1 = performance.now();
        // await pendingEngineWorker.processRequest('retrieveRecords', connectionConfig, retrieveRecordsOptions, (data: EngineCallbackData) => {
        //     if (data && data.typeId === 'complete') console.log('RETRIEVE RECORDS - RESULT', data.properties.summary);
        // });
        // const elapsedTime1 = performance.now() - startTime1;
        // console.log('RETRIEVE RECORDS - ELAPSED', elapsedTime1, `${(elapsedTime1 / 1000).toFixed(2)}s.`);
        //     /** */
        //     console.log('PREVIEW OBJECT');
        //     const startTime2 = performance.now();
        //     const previewObjectOptions: PreviewObjectOptions = { path: FILE_PATH };
        //     const previewObjectResult = (await pendingEngineWorker.processRequest('previewObject', connectionConfig, previewObjectOptions)) as DataViewConfig;
        //     const elapsedTime2 = performance.now() - startTime2;
        //     console.log('PREVIEW OBJECT - RESULT', previewObjectResult);
        //     console.log('PREVIEW OBJECT - ELAPSED', elapsedTime2, `${(elapsedTime2 / 1000).toFixed(2)}s.`);
        //     /** */
        //     // const auditContentOptions: PreviewObjectOptions = { path: FILE_PATH };
        //     // const xxxx = await pendingEngineWorker.processRequest('auditContent', connectionConfig, auditContentOptions);
        //     // console.log('xxxx', xxxx);
        //     /** */
        //     console.log('AUDIT OBJECT CONTENT JS');
        //     const startTime3 = performance.now();
        //     const auditObjectContentOptions: AuditObjectContentOptions = {
        //         chunkSize: 4096,
        //         encodingId: 'utf8',
        //         path: FILE_PATH,
        //         valueDelimiterId: ','
        //     };
        //     const auditObjectContentResult = await pendingEngineWorker.processRequest('auditObjectContent', connectionConfig, auditObjectContentOptions);
        //     const elapsedTime3 = performance.now() - startTime3;
        //     console.log('AUDIT OBJECT CONTENT JS - RESULT', auditObjectContentResult);
        //     console.log('AUDIT OBJECT CONTENT JS - ELAPSED', elapsedTime3, `${(elapsedTime3 / 1000).toFixed(2)}s.`);
        //     /** */
        //     console.log('AUDIT OBJECT CONTENT RUST');
        //     const startTime4 = performance.now();
        //     const auditObjectContentOptionsRust: AuditObjectContentOptions = {
        //         chunkSize: 4096,
        //         encodingId: 'utf8',
        //         parsingToolName: 'dpuse-tool-rust-csv-core',
        //         path: FILE_PATH,
        //         valueDelimiterId: ','
        //     };
        //     const auditObjectContentResultRust = await pendingEngineWorker.processRequest('auditObjectContent', connectionConfig, auditObjectContentOptionsRust);
        //     const elapsedTime4 = performance.now() - startTime4;
        //     console.log('AUDIT OBJECT CONTENT RUST - RESULT', auditObjectContentResultRust);
        //     console.log('AUDIT OBJECT CONTENT RUST - ELAPSED', elapsedTime4, `${(elapsedTime4 / 1000).toFixed(2)}s.`);
    }

    void streamCsvToConsole().catch((error) => console.error('Failed to start stream:', error));
    /*****/

    engineWorker = pendingEngineWorker;
    activeEngineVersion = engineVersion;

    return engineWorker;
}
