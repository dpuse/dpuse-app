// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import type { DataViewConfig, EngineWorker } from '@dpuse/dpuse-shared';

// ── Local Framework
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';
import {
    findDataViewStoreLabel,
    INVESTIGATE_STORE_CONNECTOR_ID,
    isDataViewLoaded,
    loadDataViewRecords,
    openDataViewStore,
    queryDataViewRecords
} from '@/features/studio/dataViews/_dataViewStore';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

vi.mock('@/services/engine', () => ({ establishEngineWorker: vi.fn() }));
vi.mock('@/state/configs', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/state/configs')>()),
    findConnectionLocalisedConfig: vi.fn()
}));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const processRequest = vi.fn<EngineWorker['processRequest']>();

const DATA_VIEW = {
    connectionId: 'source1',
    connectionNodeConfig: { folderPath: '/data', id: 'sales.csv', label: 'sales.csv', name: 'sales.csv', typeId: 'object' },
    contentAuditConfig: { asAt: 5, columns: [{ dataTypeId: 'string', label: { en: 'Name' } }] },
    id: 'dataView1',
    previewConfig: { dataFormatId: 'dsv', encodingId: 'utf-8', hasHeaders: true, parserId: 'parser1', valueDelimiterId: ',' }
} as unknown as DataViewConfig;

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.mocked(establishEngineWorker).mockResolvedValue({ initialise: vi.fn(), processRequest });
    vi.mocked(findConnectionLocalisedConfig).mockImplementation((connectionId) => ({ id: connectionId }) as ReturnType<typeof findConnectionLocalisedConfig>);
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('_dataViewStore', () => {
    it("names the store by its connection's label", () => {
        vi.mocked(findConnectionLocalisedConfig).mockReturnValue({ label: 'SQLite' } as ReturnType<typeof findConnectionLocalisedConfig>);

        expect(findDataViewStoreLabel()).toBe('SQLite');
        expect(findConnectionLocalisedConfig).toHaveBeenCalledWith(INVESTIGATE_STORE_CONNECTOR_ID);
    });

    it('opens the investigate store and returns its state', async () => {
        processRequest.mockResolvedValueOnce({ storeStateId: 'heldElsewhere' });

        await expect(openDataViewStore()).resolves.toBe('heldElsewhere');
        expect(processRequest).toHaveBeenCalledWith('openStore', { id: INVESTIGATE_STORE_CONNECTOR_ID }, {});
    });

    it('loads from the source the way the audit read it, reports progress, and remembers the audit it loaded', async () => {
        processRequest.mockImplementationOnce((_id, _config, _options, callback) => {
            callback?.({ properties: { recordCount: 10 }, typeId: 'progress' });
            return Promise.resolve({ recordCount: 10 });
        });
        const onProgress = vi.fn();

        expect(isDataViewLoaded(DATA_VIEW)).toBe(false);
        await loadDataViewRecords(DATA_VIEW, onProgress);

        expect(processRequest.mock.calls[0]?.[0]).toBe('loadObjectRecords');
        expect(processRequest.mock.calls[0]?.[2]).toMatchObject({
            columnConfigs: DATA_VIEW.contentAuditConfig?.columns,
            hasHeaders: true,
            path: 'dataView1',
            sourceConnectionConfig: { id: 'source1' },
            sourceOptions: { dataFormatId: 'dsv', encodingId: 'utf-8', parserId: 'parser1', valueDelimiterId: ',' }
        });
        expect(onProgress).toHaveBeenCalledWith(10);
        expect(isDataViewLoaded(DATA_VIEW)).toBe(true);
        expect(isDataViewLoaded({ ...DATA_VIEW, contentAuditConfig: { ...DATA_VIEW.contentAuditConfig, asAt: 6 } } as DataViewConfig)).toBe(false);
    });

    it('does not count a data view as loaded when its load fails', async () => {
        const failedDataView = { ...DATA_VIEW, id: 'dataView2' }; // The loaded record is kept for the session, so another id starts clean.
        processRequest.mockRejectedValueOnce(new Error('Source failed.'));

        await expect(loadDataViewRecords(failedDataView, vi.fn())).rejects.toThrow('Source failed.');
        expect(isDataViewLoaded(failedDataView)).toBe(false);
    });

    it('queries a page of the data view by its id', async () => {
        processRequest.mockResolvedValueOnce({ records: [], totalCount: 0 });
        const query = { aggregates: [], filters: [], groupColumnIndexes: [], limit: 50, offset: 100, sorts: [] };

        await queryDataViewRecords('dataView1', query);

        expect(processRequest).toHaveBeenCalledWith('queryRecords', { id: INVESTIGATE_STORE_CONNECTOR_ID }, { ...query, path: 'dataView1' });
    });
});
