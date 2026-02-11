/**
 * Engine worker composable.
 */

// Framework dependencies.
// import type { DataViewConfig } from '@datapos/datapos-shared/component/dataView';
import { useSessionStore } from '@/stores/sessionStore';
// import type { AuditObjectContentOptions, ConnectionConfig, PreviewObjectOptions, RetrieveRecordsOptions } from '@datapos/datapos-shared/component/connector';
// import type { EngineCallbackData, EngineRuntimeInterface, EngineWorkerInterface } from '@datapos/datapos-shared/engine';
import type { EngineRuntimeInterface, EngineWorkerInterface } from '@datapos/datapos-shared/engine';

/** Constants */
const ENGINE_STORAGE_URL_PREFIX = 'https://engine-eu.datapos.app';

/** Non-Reactive Variables */
let activeEngineVersion: string;
let engineWorker: EngineWorkerInterface;

/** Composables */
export async function useEngineWorker(): Promise<EngineWorkerInterface> {
    // "useEngineWorker" is not invoked until all modules have been registered in session "defineStore". So "engineConfig" will be populated.
    const engineVersion = useSessionStore().engineConfig!.version as string;

    // Return current value if previously imported and a new version has not been published.
    if (engineWorker && activeEngineVersion === engineVersion) return engineWorker;

    // Import engine and initialise interface.
    const engineInterface = (await import(/* @vite-ignore */ `${ENGINE_STORAGE_URL_PREFIX}/engine_v${engineVersion}/datapos-engine.es.js`)).default as EngineRuntimeInterface;
    const pendingEngineWorker = engineInterface.invokeWorker((errorEvent: ErrorEvent) => {
        console.error(errorEvent, 'engineWorker@useEngineWorker.1');
    });
    await pendingEngineWorker.initialise({ connectorStorageURLPrefix: `${ENGINE_STORAGE_URL_PREFIX}/connectors`, toolConfigs: useSessionStore().toolConfigs || [] });
    console.log(`[dpu] ℹ️ App: Engine v${engineVersion} loaded.`);

    /*****/
    // async function streamCsvToConsole(): Promise<void> {
    //     /** */
    //     const FILE_PATH = '/ENGAGEMENT_START_EVENTS_202405121858.csv'; //  '/ENGAGEMENT_START_EVENTS_202405121858.csv' or '/WDI_Data.csv'
    //     const LATEST_FILE_STORE_EMULATOR_VERSION = '0.2.454';
    //     const connectionConfig = {
    //         id: 'datapos-connector-file-store-emulator',
    //         description: {},
    //         authorisation: {},
    //         connectorConfig: {
    //             id: 'datapos-connector-file-store-emulator',
    //             label: { 'en-gb': '' },
    //             description: { 'en-gb': '...' },
    //             category: null,
    //             categoryId: 'database',
    //             implementations: { default: { authMethodId: 'none' } },
    //             icon: '',
    //             iconDark: '',
    //             lastUpdatedAt: null,
    //             operations: [],
    //             status: null,
    //             statusId: 'alpha',
    //             typeId: 'connector',
    //             usageId: 'bidirectional',
    //             vendorAccountURL: null,
    //             vendorDocumentationURL: null,
    //             vendorHomeURL: null,
    //             version: LATEST_FILE_STORE_EMULATOR_VERSION
    //         },
    //         lastVerifiedAt: 0,
    //         label: { 'en-gb': '' },
    //         icon: '',
    //         iconDark: '',
    //         lastUpdatedAt: null,
    //         notation: '',
    //         status: null,
    //         statusId: 'alpha',
    //         typeId: 'connectorConnection'
    //     } satisfies ConnectionConfig;

    //     /** */
    //     console.log('RETRIEVE RECORDS');
    //     const retrieveRecordsOptions: RetrieveRecordsOptions = { encodingId: 'utf8', path: FILE_PATH, valueDelimiterId: ',' };
    //     const startTime1 = performance.now();
    //     await pendingEngineWorker.processRequest('retrieveRecords', connectionConfig, retrieveRecordsOptions, (data: EngineCallbackData) => {
    //         if (data && data.typeId === 'complete') console.log('RETRIEVE RECORDS - RESULT', data.properties.summary);
    //     });
    //     const elapsedTime1 = performance.now() - startTime1;
    //     console.log('RETRIEVE RECORDS - ELAPSED', elapsedTime1, `${(elapsedTime1 / 1000).toFixed(2)}s.`);

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
    //         parsingToolName: 'datapos-tool-rust-csv-core',
    //         path: FILE_PATH,
    //         valueDelimiterId: ','
    //     };
    //     const auditObjectContentResultRust = await pendingEngineWorker.processRequest('auditObjectContent', connectionConfig, auditObjectContentOptionsRust);
    //     const elapsedTime4 = performance.now() - startTime4;
    //     console.log('AUDIT OBJECT CONTENT RUST - RESULT', auditObjectContentResultRust);
    //     console.log('AUDIT OBJECT CONTENT RUST - ELAPSED', elapsedTime4, `${(elapsedTime4 / 1000).toFixed(2)}s.`);
    // }

    // void streamCsvToConsole().catch((error) => console.error('Failed to start stream:', error));
    /*****/

    engineWorker = pendingEngineWorker;
    activeEngineVersion = engineVersion;

    return engineWorker;
}
