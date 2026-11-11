// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import type { DataViewConfig, EngineWorker } from '@dpuse/dpuse-shared';

// ── Local Framework
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';
import {
    findDataViewInvalidValueCounts,
    findDataViewStoreLabel,
    forgetDataViewLoads,
    forgetDraftLoad,
    INVESTIGATE_STORE_CONNECTOR_ID,
    isDataViewLoaded,
    loadDataViewRecords,
    openDataViewStore,
    promoteDraftLoad,
    queryDataViewColumnValueCounts,
    queryDataViewRecords,
    resolveDataViewTablePath
} from '@/features/studio/dataViews/_dataViewStore';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

vi.mock('@/services/engine', () => ({ establishEngineWorker: vi.fn() }));
vi.mock('@/state/configs', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/state/configs')>()),
    findConnectionLocalisedConfig: vi.fn()
}));

const processRequest = vi.fn<EngineWorker['processRequest']>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DUCKDB_STORE_CONNECTOR_ID = 'dpuse-connector-duckdb-wasm';

const DATA_VIEW = {
    connectionId: 'source1',
    connectionNodeConfig: { folderPath: '/data', id: 'sales.csv', label: 'sales.csv', name: 'sales.csv', typeId: 'object' },
    columnChoiceConfigs: {},
    contentAuditConfig: { asAt: 5, columns: [{ dataTypeId: 'string', label: { en: 'Name' } }] },
    id: 'dataView1',
    readingConfig: { dataFormatId: 'dsv', encodingId: 'utf-8', hasHeaders: true, parserId: 'parser1', valueDelimiterId: ',' },
    sampleConfig: {
        dataFormatId: 'dsv',
        decodedEncodingId: 'utf-8',
        hasHeaders: true,
        parsedRecords: [[{ value: 'Name', valueWasQuoted: false }]],
        parserId: 'parser1',
        valueDelimiterId: ','
    }
} as unknown as DataViewConfig;

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.mocked(establishEngineWorker).mockResolvedValue({ initialise: vi.fn(), processRequest });
    vi.mocked(findConnectionLocalisedConfig).mockImplementation(
        (connectionId) =>
            (connectionId === 'source1' ? { connectorConfig: { itemTypeId: 'file' }, id: connectionId } : { id: connectionId }) as ReturnType<typeof findConnectionLocalisedConfig> // The source's kind of item decides whether it has an encoding.
    );
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('_dataViewStore', () => {
    it("names the store by its connection's label", () => {
        vi.mocked(findConnectionLocalisedConfig).mockReturnValue({ label: 'SQLite' } as ReturnType<typeof findConnectionLocalisedConfig>);

        expect(findDataViewStoreLabel(INVESTIGATE_STORE_CONNECTOR_ID)).toBe('SQLite');
        expect(findConnectionLocalisedConfig).toHaveBeenCalledWith(INVESTIGATE_STORE_CONNECTOR_ID);
    });

    it('opens the investigate store and returns its state', async () => {
        processRequest.mockResolvedValueOnce({ storeStateId: 'heldElsewhere' });

        await expect(openDataViewStore(INVESTIGATE_STORE_CONNECTOR_ID)).resolves.toBe('heldElsewhere');
        expect(processRequest).toHaveBeenCalledWith('openStore', { id: INVESTIGATE_STORE_CONNECTOR_ID }, {});
    });

    it('loads from the source the way the data view reads it, reports progress, and remembers the columns it loaded', async () => {
        processRequest.mockImplementationOnce((_id, _config, _options, callback) => {
            callback?.({ properties: { recordCount: 10 }, typeId: 'progress' });
            return Promise.resolve({ columnsHaveChanged: false, invalidValueCounts: [0], recordCount: 10 });
        });
        const onProgress = vi.fn();

        expect(isDataViewLoaded(DATA_VIEW, false)).toBe(false);
        await loadDataViewRecords(DATA_VIEW, false, onProgress);

        expect(processRequest.mock.calls[0]?.[0]).toBe('loadObjectRecords');
        expect(processRequest.mock.calls[0]?.[2]).toMatchObject({
            columnConfigs: DATA_VIEW.contentAuditConfig?.columns,
            hasHeaders: true,
            headerValues: ['Name'],
            ignoredColumnIndexes: [],
            path: 'dataView1',
            sourceConnectionConfig: { connectorConfig: { itemTypeId: 'file' }, id: 'source1' },
            sourceOptions: { dataFormatId: 'dsv', encodingId: 'utf-8', parserId: 'parser1', valueDelimiterId: ',' }
        });
        expect(onProgress).toHaveBeenCalledWith(10);
        expect(isDataViewLoaded(DATA_VIEW, false)).toBe(true);
        expect(isDataViewLoaded({ ...DATA_VIEW, contentAuditConfig: { ...DATA_VIEW.contentAuditConfig, asAt: 6 } } as DataViewConfig, false)).toBe(false);
    });

    it('sends no encoding or value delimiter for a source that is not a file', async () => {
        vi.mocked(findConnectionLocalisedConfig).mockImplementation(
            (connectionId) => ({ connectorConfig: { itemTypeId: 'table' }, id: connectionId }) as ReturnType<typeof findConnectionLocalisedConfig>
        );
        const tableDataView = {
            ...DATA_VIEW,
            id: 'tableDataView',
            sampleConfig: { ...DATA_VIEW.sampleConfig, decodedEncodingId: undefined, valueDelimiterId: undefined }
        } as DataViewConfig;
        processRequest.mockResolvedValueOnce({ columnsHaveChanged: false, invalidValueCounts: [0], recordCount: 1 });

        await loadDataViewRecords(tableDataView, false, vi.fn());

        expect(processRequest.mock.calls[0]?.[2]).toMatchObject({ sourceOptions: { encodingId: undefined, valueDelimiterId: undefined } });
    });

    it('does not count a data view as loaded when a chosen type changes after its load', async () => {
        const typedDataView = { ...DATA_VIEW, id: 'dataView3' };
        processRequest.mockResolvedValueOnce({ columnsHaveChanged: false, invalidValueCounts: [0], recordCount: 1 });
        await loadDataViewRecords(typedDataView, false, vi.fn());

        const columnChoiceConfigs = {
            0: { dataSubtypeId: undefined, dataTypeId: 'numeric', dateOrderId: undefined, decimalSeparatorId: undefined, isIgnored: undefined, nullWordsAreEmpty: undefined }
        } as const;
        expect(isDataViewLoaded({ ...typedDataView, columnChoiceConfigs }, false)).toBe(false);
    });

    it('keeps the earlier load when the columns have moved', async () => {
        const movedDataView = { ...DATA_VIEW, id: 'dataView4' };
        processRequest.mockResolvedValueOnce({ columnsHaveChanged: true, invalidValueCounts: [], recordCount: 0 });

        await expect(loadDataViewRecords(movedDataView, false, vi.fn())).resolves.toMatchObject({ columnsHaveChanged: true });
        expect(isDataViewLoaded(movedDataView, false)).toBe(false);
    });

    it('does not count a data view as loaded when its load fails', async () => {
        const failedDataView = { ...DATA_VIEW, id: 'dataView2' }; // The loaded record is kept for the session, so another id starts clean.
        processRequest.mockRejectedValueOnce(new Error('Source failed.'));

        await expect(loadDataViewRecords(failedDataView, false, vi.fn())).rejects.toThrow('Source failed.');
        expect(isDataViewLoaded(failedDataView, false)).toBe(false);
    });

    it('loads a working copy into its own table, leaving the saved data view unloaded', async () => {
        const editedDataView = { ...DATA_VIEW, id: 'dataView5' };
        processRequest.mockResolvedValueOnce({ columnsHaveChanged: false, invalidValueCounts: [0], recordCount: 1 });

        await loadDataViewRecords(editedDataView, true, vi.fn());

        const tablePath = resolveDataViewTablePath(editedDataView, true);
        expect(tablePath).toMatch(/^dataView5-/u);
        expect(processRequest.mock.calls[0]?.[2]).toMatchObject({ path: tablePath });
        expect(isDataViewLoaded(editedDataView, true)).toBe(true);
        expect(isDataViewLoaded(editedDataView, false)).toBe(false);
        expect(resolveDataViewTablePath(editedDataView, false)).toBe('dataView5');
    });

    it('makes the draft’s table the saved one on Save, and drops the old table when the store next opens', async () => {
        const editedDataView = { ...DATA_VIEW, id: 'dataView6' };
        processRequest.mockResolvedValueOnce({ columnsHaveChanged: false, invalidValueCounts: [0], recordCount: 1 });
        await loadDataViewRecords(editedDataView, true, vi.fn());
        const tablePath = resolveDataViewTablePath(editedDataView, true);

        promoteDraftLoad(editedDataView);

        expect(resolveDataViewTablePath(editedDataView, false)).toBe(tablePath);
        expect(isDataViewLoaded(editedDataView, false)).toBe(true);
        expect(isDataViewLoaded(editedDataView, true)).toBe(false);

        processRequest.mockResolvedValueOnce({ storeStateId: 'ready' });
        processRequest.mockResolvedValue(undefined);
        await openDataViewStore(INVESTIGATE_STORE_CONNECTOR_ID);
        expect(processRequest).toHaveBeenCalledWith('dropObject', { id: INVESTIGATE_STORE_CONNECTOR_ID }, { path: 'dataView6' });
    });

    it('keeps each load’s counts of values that did not fit, moves them with the draft on Save, and forgets them on Discard', async () => {
        const editedDataView = { ...DATA_VIEW, id: 'dataView20' };
        processRequest.mockResolvedValue({ columnsHaveChanged: false, invalidValueCounts: [3], recordCount: 9 });

        expect(findDataViewInvalidValueCounts(editedDataView, true)).toBeUndefined();
        await loadDataViewRecords(editedDataView, true, vi.fn());
        expect(findDataViewInvalidValueCounts(editedDataView, true)).toEqual([3]);

        promoteDraftLoad(editedDataView);
        expect(findDataViewInvalidValueCounts(editedDataView, false)).toEqual([3]);
        expect(findDataViewInvalidValueCounts(editedDataView, true)).toBeUndefined();

        await loadDataViewRecords(editedDataView, true, vi.fn());
        forgetDraftLoad(editedDataView.id);
        expect(findDataViewInvalidValueCounts(editedDataView, true)).toBeUndefined();
        expect(findDataViewInvalidValueCounts(editedDataView, false)).toEqual([3]);
    });

    it('drops only the draft’s table on Discard', async () => {
        const editedDataView = { ...DATA_VIEW, id: 'dataView7' };
        processRequest.mockResolvedValueOnce({ columnsHaveChanged: false, invalidValueCounts: [0], recordCount: 1 });
        await loadDataViewRecords(editedDataView, true, vi.fn());
        const tablePath = resolveDataViewTablePath(editedDataView, true);

        forgetDraftLoad('dataView7');

        expect(resolveDataViewTablePath(editedDataView, false)).toBe('dataView7');
        processRequest.mockResolvedValueOnce({ storeStateId: 'ready' });
        processRequest.mockResolvedValue(undefined);
        await openDataViewStore(INVESTIGATE_STORE_CONNECTOR_ID);
        expect(processRequest).toHaveBeenCalledWith('dropObject', { id: INVESTIGATE_STORE_CONNECTOR_ID }, { path: tablePath });
        expect(processRequest).not.toHaveBeenCalledWith('dropObject', { id: INVESTIGATE_STORE_CONNECTOR_ID }, { path: 'dataView7' });
    });

    it('drops the table of a draft lost to a reload or crash, but keeps the open draft’s', async () => {
        const abandonedDataView = { ...DATA_VIEW, id: 'dataView10' };
        const openDataView = { ...DATA_VIEW, id: 'dataView11' };
        processRequest.mockResolvedValue({ columnsHaveChanged: false, invalidValueCounts: [0], recordCount: 1 });
        await loadDataViewRecords(abandonedDataView, true, vi.fn());
        await loadDataViewRecords(openDataView, true, vi.fn());
        const abandonedTablePath = resolveDataViewTablePath(abandonedDataView, true);
        const openTablePath = resolveDataViewTablePath(openDataView, true);

        processRequest.mockResolvedValueOnce({ storeStateId: 'ready' });
        processRequest.mockResolvedValue(undefined);
        await openDataViewStore(INVESTIGATE_STORE_CONNECTOR_ID, 'dataView11');

        expect(processRequest).toHaveBeenCalledWith('dropObject', { id: INVESTIGATE_STORE_CONNECTOR_ID }, { path: abandonedTablePath });
        expect(processRequest).not.toHaveBeenCalledWith('dropObject', { id: INVESTIGATE_STORE_CONNECTOR_ID }, { path: openTablePath });
        expect(isDataViewLoaded(openDataView, true)).toBe(true);
    });

    it('drops a deleted data view’s table when the store next opens', async () => {
        forgetDataViewLoads('dataView8');

        processRequest.mockResolvedValueOnce({ storeStateId: 'ready' });
        processRequest.mockResolvedValue(undefined);
        await openDataViewStore(INVESTIGATE_STORE_CONNECTOR_ID);

        expect(processRequest).toHaveBeenCalledWith('dropObject', { id: INVESTIGATE_STORE_CONNECTOR_ID }, { path: 'dataView8' });
    });

    it('loads into the store the data view chose, and drops its table in the default store on Save', async () => {
        const chosenStoreDataView = { ...DATA_VIEW, id: 'dataView12', storeConnectorId: DUCKDB_STORE_CONNECTOR_ID };
        processRequest.mockResolvedValueOnce({ columnsHaveChanged: false, invalidValueCounts: [0], recordCount: 1 });

        await loadDataViewRecords(chosenStoreDataView, true, vi.fn());

        expect(processRequest.mock.calls[0]?.[1]).toEqual({ id: DUCKDB_STORE_CONNECTOR_ID });
        expect(isDataViewLoaded(chosenStoreDataView, true)).toBe(true);
        expect(isDataViewLoaded({ ...chosenStoreDataView, storeConnectorId: undefined }, true)).toBe(false);

        promoteDraftLoad(chosenStoreDataView);
        processRequest.mockResolvedValueOnce({ storeStateId: 'ready' });
        processRequest.mockResolvedValue(undefined);
        await openDataViewStore(INVESTIGATE_STORE_CONNECTOR_ID);

        expect(processRequest).toHaveBeenCalledWith('dropObject', { id: INVESTIGATE_STORE_CONNECTOR_ID }, { path: 'dataView12' });
        expect(isDataViewLoaded(chosenStoreDataView, false)).toBe(true);
    });

    it('counts a column’s valid values in full, listing the least frequent apart from the most frequent', async () => {
        const mostFrequent = Array.from({ length: 10 }, (_, index) => [`v${String(index)}`, 100 - index]);
        processRequest
            .mockResolvedValueOnce({ records: mostFrequent, totalCount: 12 })
            .mockResolvedValueOnce({
                records: [
                    [new Date('2026-01-02T00:00:00.000Z'), 1],
                    ['v9', 91]
                ],
                totalCount: 12
            })
            .mockResolvedValueOnce({ records: [[1]], totalCount: 1234 });

        const valueCounts = await queryDataViewColumnValueCounts(INVESTIGATE_STORE_CONNECTOR_ID, 'dataView1', 2);

        expect(valueCounts.validDistinctValueCount).toBe(12);
        expect(valueCounts.validValueCount).toBe(1234);
        expect(Object.keys(valueCounts.validFrequentValues ?? {})).toHaveLength(10);
        expect(valueCounts.validLeastFrequentValues).toStrictEqual({ '2026-01-02T00:00:00.000Z': 1 }); // 'v9' is already among the most frequent.
        const notEmptyFilter = [{ columnIndex: 2, operatorId: 'isNotEmpty', value: null }];
        expect(processRequest.mock.calls.map((call) => call[2])).toStrictEqual([
            {
                aggregates: [{ columnIndex: undefined, functionId: 'count' }],
                filters: notEmptyFilter,
                groupColumnIndexes: [2],
                limit: 10,
                offset: 0,
                path: 'dataView1',
                sorts: [
                    { columnIndex: 1, directionId: 'descending' },
                    { columnIndex: 0, directionId: 'ascending' }
                ]
            },
            {
                aggregates: [{ columnIndex: undefined, functionId: 'count' }],
                filters: notEmptyFilter,
                groupColumnIndexes: [2],
                limit: 2, // Only two values are not among the most frequent.
                offset: 0,
                path: 'dataView1',
                sorts: [
                    { columnIndex: 1, directionId: 'ascending' },
                    { columnIndex: 0, directionId: 'ascending' }
                ]
            },
            { aggregates: [], filters: notEmptyFilter, groupColumnIndexes: [], limit: 1, offset: 0, path: 'dataView1', sorts: [] }
        ]);
    });

    it('queries a page of the data view by its id', async () => {
        processRequest.mockResolvedValueOnce({ records: [], totalCount: 0 });
        const query = { aggregates: [], filters: [], groupColumnIndexes: [], limit: 50, offset: 100, sorts: [] };

        await queryDataViewRecords(INVESTIGATE_STORE_CONNECTOR_ID, 'dataView1', query);

        expect(processRequest).toHaveBeenCalledWith('queryRecords', { id: INVESTIGATE_STORE_CONNECTOR_ID }, { ...query, path: 'dataView1' });
    });
});
