// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, type VNode } from 'vue';
import { mount, RouterLinkStub } from '@vue/test-utils';

// ── DPUse Framework
import { constructStoreError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { changeDataView } from '@/features/studio/dataViews/_dataViewDraft';
import ColumnDetailPanel from '@/features/studio/dataViews/ColumnDetailPanel.vue';
import { constructFittedColumnWidth } from '@/components/ui/table/tableColumnWidth';
import type { DataViewStoreConfig } from '@/features/studio/dataViews/_dataViewStore';
import InvestigateDataPanel from '@/features/studio/dataViews/exploreData/InvestigateDataPanel.vue';
import { settle } from '~/tests/support/settle';
import { storeTakeover } from '@/services/storeUse';
import { TEXT } from '@/features/studio/dataViews/exploreData/InvestigateDataPanel_.json';
import {
    abortDataViewRecordLoad,
    constructLoadTimingParts,
    findDataViewInvalidValueCounts,
    findDataViewLoadTiming,
    forgetDataViewLoad,
    hasDataViewLoad,
    isDataViewLoaded,
    listDataViewStoreConfigs,
    loadDataViewRecords,
    openDataViewStore,
    queryDataViewColumnValueCounts,
    queryDataViewRecords
} from '@/features/studio/dataViews/_dataViewStore';
import { formatElapsedDuration, formatFinishedDuration, formatStatusPercentage } from '@/features/studio/dataViews/_statusBar';
import { localeId, t } from '@/state/locale';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface TableProperties {
    columnDefinitions: { accessorKey: string; header: string; size: number }[];
    constructCellClass: (columnId: string) => string | undefined;
    dataSource: { getRows: (startRow: number, endRow: number) => Promise<{ rows: Record<string, string>[]; totalCount: number }> };
}

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const routerPush = vi.hoisted(() => vi.fn(() => Promise.resolve())); // Stands for opening the item step.

// The panel reads the data view the route names. The spec sets that data view directly.
const dataView = vi.hoisted((): { config: unknown } => ({ config: undefined }));
vi.mock('@/features/studio/dataViews/_dataViews', async (importOriginal) => {
    const { computed } = await import('vue');
    return {
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
        ...(await importOriginal<typeof import('@/features/studio/dataViews/_dataViews')>()),
        useCurrentDataView: (): { data: unknown; draftIsCurrent: unknown } => ({ data: computed(() => dataView.config), draftIsCurrent: computed(() => false) })
    };
});
// A store choice goes into the data view's draft. The spec checks what was put there.
vi.mock('@/features/studio/dataViews/_dataViewDraft', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/features/studio/dataViews/_dataViewDraft')>()),
    changeDataView: vi.fn()
}));
vi.mock('@/features/studio/dataViews/_dataViewStore', () => ({
    abortDataViewRecordLoad: vi.fn(),
    constructLoadTimingParts: vi.fn(),
    constructStoredColumnConfigs: (): { label: string }[] => STORED_COLUMN_CONFIGS,
    findDataViewInvalidValueCounts: vi.fn(),
    findDataViewLoadTiming: vi.fn(),
    forgetDataViewLoad: vi.fn(),
    hasDataViewLoad: vi.fn(),
    INVESTIGATE_STORE_CONNECTOR_ID: 'dpuse-connector-sqlite-wasm',
    isDataViewLoaded: vi.fn(),
    listDataViewStoreConfigs: vi.fn((): unknown[] => []),
    loadDataViewRecords: vi.fn(),
    openDataViewStore: vi.fn(),
    queryDataViewColumnValueCounts: vi.fn(),
    queryDataViewRecords: vi.fn(),
    resolveDataViewTablePath: ({ id }: { id: string }): string => id,
    resolveStoreConnectorId: (config?: { storeConnectorId?: string }): string => config?.storeConnectorId ?? 'dpuse-connector-sqlite-wasm'
}));
// The panel holds its store while it shows it. The release stands for letting go, which closes the store for other tabs.
const storeUse = vi.hoisted(() => ({ releaseStore: vi.fn(() => Promise.resolve()) }));
vi.mock('@/services/storeUse', async () => {
    const { shallowRef } = await import('vue');
    return { holdStore: vi.fn(() => storeUse.releaseStore), isStoreConnection: vi.fn(() => false), openStore: vi.fn(), storeTakeover: shallowRef() };
});
// The shared check tells the panel whether the item has changed. The spec says what the check found.
const itemChange = vi.hoisted(() => ({ changedAt: undefined as number | undefined, ignoreItemChange: vi.fn(), isShown: false }));
vi.mock('@/features/studio/dataViews/_itemChange', async () => {
    const { computed } = await import('vue');
    return {
        useItemChange: (): unknown => ({
            ignoreItemChange: itemChange.ignoreItemChange,
            itemChangedAt: computed(() => itemChange.changedAt),
            itemChangeIsShown: computed(() => itemChange.isShown)
        })
    };
});
vi.mock('@/components/ui/table/tableColumnWidth', () => ({ HEADER_MENU_WIDTH_PX: 24, HEADER_TAB_INSET_PX: 10, constructFittedColumnWidth: vi.fn() }));

vi.mock('vue-router', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('vue-router')>()),
    useRoute: (): { params: { dataViewId: string } } => ({ params: { dataViewId: 'dataView1' } }),
    useRouter: (): { push: typeof routerPush } => ({ push: routerPush })
}));

// The table scrolls and measures, which jsdom cannot, so it is stood in for and what it is given is checked. It renders
// the panel's toolbar actions, and each column's name through the panel's own 'header-label' slot, so a column's detail
// can be opened from it.
const TableStub = defineComponent({
    props: {
        columnDefinitions: { type: Array<{ accessorKey: string }>, required: true },
        constructCellClass: { type: Function, required: true },
        dataSource: { type: Object, required: true }
    },
    setup:
        (properties, { slots }) =>
        (): VNode =>
            h('div', [
                slots['toolbar-end']?.(),
                ...properties.columnDefinitions.map((columnDefinition) => slots['header-label']?.({ columnId: columnDefinition.accessorKey }))
            ])
});

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const AUDITED_DATA_VIEW = {
    contentAuditConfig: {
        asAt: 1,
        columns: [
            { dataSubtypeId: 'integer', dataTypeId: 'numeric', label: { en: 'Id' } },
            { dataSubtypeId: 'date', dataTypeId: 'temporal', label: { en: 'Day' } }
        ]
    },
    id: 'dataView1'
};
const SIZED_DATA_VIEW = { ...AUDITED_DATA_VIEW, connectionNodeConfig: { size: 1000 } }; // An item whose size is known, so a load can show how far it has got.
const LOAD_TIMING = { conversionDuration: 0, duration: 0, parseDuration: 0, retrieveDuration: 0, sourceWaitDuration: 0, storeDuration: 0, totalDuration: 0 }; // Its parts are given by 'constructLoadTimingParts'.
const STORE_CONFIGS: DataViewStoreConfig[] = [
    { icon: null, iconDark: null, id: 'dpuse-connector-duckdb-wasm', isPlanned: false, label: 'DuckDB' },
    { icon: null, iconDark: null, id: 'dpuse-connector-pglite', isPlanned: true, label: 'PGlite' },
    { icon: null, iconDark: null, id: 'dpuse-connector-sqlite-wasm', isPlanned: false, label: 'SQLite' }
];
const STORED_COLUMN_CONFIGS = [{ label: 'Stored' }]; // Stands for the columns the store module works out, which the panel passes on to every query.

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.mocked(openDataViewStore).mockResolvedValue('ready');
    vi.mocked(isDataViewLoaded).mockReturnValue(true);
    vi.mocked(hasDataViewLoad).mockReturnValue(false);
    vi.mocked(loadDataViewRecords).mockResolvedValue({ columnsHaveChanged: false, invalidValueCounts: [], recordCount: 0 });
    vi.mocked(findDataViewInvalidValueCounts).mockReturnValue(undefined);
    vi.mocked(findDataViewLoadTiming).mockReturnValue(undefined);
});

afterEach(() => {
    dataView.config = undefined;
    itemChange.changedAt = undefined;
    itemChange.isShown = false;
    storeTakeover.value = undefined;
    history.replaceState(null, '');
    vi.clearAllMocks();
});

describe('InvestigateDataPanel', () => {
    it('says the columns have changed, and shows no records, when the load finds they have moved', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        history.replaceState({ loadIsRequested: true }, '');
        vi.mocked(loadDataViewRecords).mockResolvedValue({ columnsHaveChanged: true, invalidValueCounts: [], recordCount: 0 });
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'columns.changed.text'));
        expect(wrapper.findComponent(TableStub).exists()).toBe(false);
    });

    it('asks for a preview, and opens no store, when the data view has no columns', async () => {
        dataView.config = { contentAuditConfig: undefined, id: 'dataView1' };
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'columns.required.text'));
        expect(openDataViewStore).not.toHaveBeenCalled();
    });

    it('shows a loaded data view without loading it again, a page at a time with its values formatted', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(queryDataViewRecords).mockResolvedValue({ records: [[7, new Date(Date.UTC(2026, 9, 28))]], totalCount: 1 });
        const wrapper = mountPanel();
        await settle();

        const table = wrapper.findComponent(TableStub).props() as TableProperties;
        const page = await table.dataSource.getRows(0, 100);

        expect(loadDataViewRecords).not.toHaveBeenCalled();
        expect(table.columnDefinitions.map((column) => column.header)).toEqual(['Id', 'Day']);
        expect(queryDataViewRecords).toHaveBeenCalledWith('dpuse-connector-sqlite-wasm', 'dataView1', STORED_COLUMN_CONFIGS, {
            aggregates: [],
            filters: [],
            groupColumnIndexes: [],
            limit: 100,
            offset: 0,
            sorts: []
        });
        const expectedDateText = new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium', timeZone: 'UTC' }).format(Date.UTC(2026, 9, 28));
        expect(page).toEqual({ rows: [{ c0: '7', c1: expectedDateText }], totalCount: 1 });
    });

    it('shows numbers to the right with their column’s decimals, never rounding a longer one', async () => {
        dataView.config = {
            ...AUDITED_DATA_VIEW,
            contentAuditConfig: { asAt: 1, columns: [{ dataSubtypeId: 'decimal', dataTypeId: 'numeric', label: { en: 'Score' }, validMaxDecimals: 2 }] }
        };
        vi.mocked(queryDataViewRecords).mockResolvedValue({ records: [[50], [87.1], [1.2345]], totalCount: 3 });
        const wrapper = mountPanel();
        await settle();

        const table = wrapper.findComponent(TableStub).props() as TableProperties;
        const page = await table.dataSource.getRows(0, 100);

        expect(page.rows.map((row) => row.c0)).toEqual(['50.00', '87.10', '1.2345']);
        expect(table.constructCellClass('c0')).toContain('justify-end');
    });

    it('fits its columns to the first page of a load, once, so scrolling back cannot move them', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(queryDataViewRecords).mockResolvedValue({ records: [[7, new Date(Date.UTC(2026, 9, 28))]], totalCount: 1 });
        vi.mocked(constructFittedColumnWidth).mockReturnValueOnce(90).mockReturnValueOnce(130);
        const wrapper = mountPanel();
        await settle();

        const { dataSource } = wrapper.findComponent(TableStub).props() as TableProperties;
        await dataSource.getRows(100, 200);
        await settle();
        expect((wrapper.findComponent(TableStub).props() as TableProperties).columnDefinitions.map((column) => column.size)).toEqual([160, 160]);

        await dataSource.getRows(0, 100);
        await dataSource.getRows(0, 100);
        await settle();

        expect((wrapper.findComponent(TableStub).props() as TableProperties).columnDefinitions.map((column) => column.size)).toEqual([90, 130]);
        expect(constructFittedColumnWidth).toHaveBeenCalledWith('Id', ['7'], { headerExtraPx: 34 }); // The menu button and the tab's inset both take room from the label.
    });

    it('leaves a column that is not numbers on the left', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        const wrapper = mountPanel();
        await settle();

        const table = wrapper.findComponent(TableStub).props() as TableProperties;

        expect(table.constructCellClass('c1')).toBe('tabular-nums');
    });

    it('loads straight away when the pill asked for the data, once only, then shows it', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        history.replaceState({ loadIsRequested: true }, '');
        const wrapper = mountPanel();
        await settle();

        expect(loadDataViewRecords).toHaveBeenCalledOnce();
        expect(wrapper.findComponent(TableStub).exists()).toBe(true);
        expect((history.state as { loadIsRequested: boolean }).loadIsRequested).toBe(false);
    });

    it('starts no load when opened from the task bar, and loads when asked', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'load.required.text'));
        expect(openDataViewStore).not.toHaveBeenCalled();

        await wrapper
            .findAll('button')
            .find((button) => button.text() === t(TEXT, 'load.data.label'))
            ?.trigger('click');
        await settle();

        expect(loadDataViewRecords).toHaveBeenCalledOnce();
    });

    it('says the types have changed when an earlier load no longer matches', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        vi.mocked(hasDataViewLoad).mockReturnValue(true);
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'load.changed.text'));
        expect(wrapper.findAll('button').some((button) => button.text() === t(TEXT, 'load.again.label'))).toBe(true);
    });

    it('opens a column’s detail from its name, read only, with a link to change it on the item step', async () => {
        dataView.config = {
            ...AUDITED_DATA_VIEW,
            contentAuditConfig: {
                asAt: 1,
                columns: AUDITED_DATA_VIEW.contentAuditConfig.columns.map((columnConfig) => ({ ...columnConfig, validFormats: {}, inferenceCounts: {} })) // What every audited column holds.
            },
            readingConfig: { dataFormatId: 'dsv' },
            sampleConfig: { parsedRecords: [], size: 0, text: '' }
        };
        const wrapper = mount(InvestigateDataPanel, { global: { stubs: { RouterLink: RouterLinkStub, Table: TableStub } } });
        await settle();

        await wrapper
            .findAll('button')
            .find((button) => button.text() === 'Day')
            ?.trigger('click');

        const detail = wrapper.findComponent(ColumnDetailPanel);
        expect(detail.props('columnIndex')).toBe(1);
        expect(detail.props('isTypeDisabled')).toBe(true);
        expect(wrapper.findComponent(RouterLinkStub).props('to')).toMatchObject({ name: 'item', state: { columnIndex: 1 } });
    });

    it('counts a column’s values in the store when the audit stopped counting them, and shows the counts in its detail', async () => {
        const uncountedColumn = { ...AUDITED_DATA_VIEW.contentAuditConfig.columns[1], inferenceCounts: {}, validFormats: {}, validFrequentValues: {}, validValueCount: 5000 }; // An audit keeps no counts for a column past its limit.
        dataView.config = {
            ...AUDITED_DATA_VIEW,
            contentAuditConfig: { asAt: 1, columns: [{ ...AUDITED_DATA_VIEW.contentAuditConfig.columns[0], inferenceCounts: {}, validFormats: {} }, uncountedColumn] },
            readingConfig: { dataFormatId: 'dsv' },
            sampleConfig: { parsedRecords: [], size: 0, text: '' }
        };
        const valueCounts = { validDistinctValueCount: 4321, validFrequentValues: { a: 9 }, validLeastFrequentValues: { z: 1 }, validValueCount: 6000 };
        vi.mocked(queryDataViewColumnValueCounts).mockResolvedValue(valueCounts);
        const wrapper = mount(InvestigateDataPanel, { global: { stubs: { RouterLink: RouterLinkStub, Table: TableStub } } });
        await settle();

        await wrapper
            .findAll('button')
            .find((button) => button.text() === 'Day')
            ?.trigger('click');
        await settle();

        expect(queryDataViewColumnValueCounts).toHaveBeenCalledWith('dpuse-connector-sqlite-wasm', 'dataView1', STORED_COLUMN_CONFIGS, 1);
        const { columnConfigs } = wrapper.findComponent(ColumnDetailPanel).props('itemReading');
        expect(columnConfigs[1]).toMatchObject(valueCounts);
    });

    it('counts a column’s values in the store when the audit only estimated them, and shows the counts as exact', async () => {
        const estimatedCounts = { validCountsAreEstimated: true, validDistinctValueCount: 4400, validFrequentValues: { a: 8 }, validValueCount: 6000 };
        const estimatedColumn = { ...AUDITED_DATA_VIEW.contentAuditConfig.columns[1], inferenceCounts: {}, validFormats: {}, ...estimatedCounts };
        dataView.config = {
            ...AUDITED_DATA_VIEW,
            contentAuditConfig: { asAt: 1, columns: [{ ...AUDITED_DATA_VIEW.contentAuditConfig.columns[0], inferenceCounts: {}, validFormats: {} }, estimatedColumn] },
            readingConfig: { dataFormatId: 'dsv' },
            sampleConfig: { parsedRecords: [], size: 0, text: '' }
        };
        const valueCounts = { validDistinctValueCount: 4321, validFrequentValues: { a: 9 }, validLeastFrequentValues: { z: 1 }, validValueCount: 6000 };
        vi.mocked(queryDataViewColumnValueCounts).mockResolvedValue(valueCounts);
        const wrapper = mount(InvestigateDataPanel, { global: { stubs: { RouterLink: RouterLinkStub, Table: TableStub } } });
        await settle();

        await wrapper
            .findAll('button')
            .find((button) => button.text() === 'Day')
            ?.trigger('click');
        await settle();

        expect(queryDataViewColumnValueCounts).toHaveBeenCalledWith('dpuse-connector-sqlite-wasm', 'dataView1', STORED_COLUMN_CONFIGS, 1);
        const { columnConfigs } = wrapper.findComponent(ColumnDetailPanel).props('itemReading');
        expect(columnConfigs[1]).toMatchObject({ ...valueCounts, validCountsAreEstimated: undefined });
    });

    it('counts a column at its position in the store, which leaves ignored columns out', async () => {
        const uncountedColumn = { ...AUDITED_DATA_VIEW.contentAuditConfig.columns[1], inferenceCounts: {}, validFormats: {}, validFrequentValues: {}, validValueCount: 5000 };
        dataView.config = {
            ...AUDITED_DATA_VIEW,
            columnChoiceConfigs: { 0: { isIgnored: true } },
            contentAuditConfig: { asAt: 1, columns: [{ ...AUDITED_DATA_VIEW.contentAuditConfig.columns[0], inferenceCounts: {}, validFormats: {} }, uncountedColumn] },
            readingConfig: { dataFormatId: 'dsv' },
            sampleConfig: { parsedRecords: [], size: 0, text: '' }
        };
        vi.mocked(queryDataViewColumnValueCounts).mockResolvedValue({ validDistinctValueCount: 1, validFrequentValues: {}, validLeastFrequentValues: {}, validValueCount: 1 });
        const wrapper = mount(InvestigateDataPanel, { global: { stubs: { RouterLink: RouterLinkStub, Table: TableStub } } });
        await settle();

        await wrapper
            .findAll('button')
            .find((button) => button.text() === 'Day')
            ?.trigger('click');
        await settle();

        expect(queryDataViewColumnValueCounts).toHaveBeenCalledWith('dpuse-connector-sqlite-wasm', 'dataView1', STORED_COLUMN_CONFIGS, 0);
    });

    it('shows how many values did not fit, by column, from the counts kept with an earlier load', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(findDataViewInvalidValueCounts).mockReturnValue([312, 0]);
        const wrapper = mountPanel();
        await settle();

        const count = new Intl.NumberFormat(localeId.value).format(312);
        const mismatchText = wrapper.find('[role="status"]').text();
        expect(mismatchText).toContain(t(TEXT, 'invalid.text', { count, label: 'Id' }));
        expect(mismatchText).not.toContain('Day');
    });

    it('says a finished load read all the records, which store they went into and how long it took, with a full green bar', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        history.replaceState({ loadIsRequested: true }, '');
        let clockTime = 1000;
        const clock = vi.spyOn(performance, 'now').mockImplementation(() => clockTime);
        vi.mocked(loadDataViewRecords).mockImplementationOnce(() => {
            clockTime += 12_500;
            return Promise.resolve({ columnsHaveChanged: false, invalidValueCounts: [], recordCount: 375_000 });
        });
        const wrapper = mountPanel();
        await settle();
        clock.mockRestore();

        const records = constructRecordsText(375_000);
        expect(wrapper.text()).toContain(t(TEXT, 'load.complete.other.text', { duration: formatFinishedDuration(12_500), records }));
        const meter = wrapper.find('[role="meter"]');
        expect(meter.attributes('aria-valuenow')).toBe('100');
        expect(meter.find('div').classes().join(' ')).toContain('success');
    });

    it('shows how far a running load has got, with its records, share of the item and time, and no busy bar', async () => {
        dataView.config = SIZED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        history.replaceState({ loadIsRequested: true }, '');
        vi.mocked(loadDataViewRecords).mockImplementationOnce((_config, _isDraft, onProgress) => {
            onProgress(120, 250, undefined);
            return new Promise<never>(vi.fn()); // Never settles, so the load is still running.
        });
        const wrapper = mountPanel();
        await settle();

        const percentage = formatStatusPercentage(25);
        expect(wrapper.text()).toContain(t(TEXT, 'load.running.percentage.text', { duration: formatElapsedDuration(0), percentage, records: constructRecordsText(120) }));
        expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('25');
        expect(wrapper.find('[data-region="BusyBar"]').exists()).toBe(false);
    });

    it('shows how far a running load from a store has got, in records out of the total the store counted', async () => {
        dataView.config = SIZED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        history.replaceState({ loadIsRequested: true }, '');
        vi.mocked(loadDataViewRecords).mockImplementationOnce((_config, _isDraft, onProgress) => {
            onProgress(120, undefined, 480);
            return new Promise<never>(vi.fn());
        });
        const wrapper = mountPanel();
        await settle();

        const percentage = formatStatusPercentage(25);
        expect(wrapper.text()).toContain(t(TEXT, 'load.running.percentage.text', { duration: formatElapsedDuration(0), percentage, records: constructRecordsText(120) }));
        expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('25');
    });

    it('never shows a load from a store as more than complete when records were added after the count', async () => {
        dataView.config = SIZED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        history.replaceState({ loadIsRequested: true }, '');
        vi.mocked(loadDataViewRecords).mockImplementationOnce((_config, _isDraft, onProgress) => {
            onProgress(500, undefined, 480);
            return new Promise<never>(vi.fn());
        });
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('100');
    });

    it('shows a running load’s records and time without a bar when the source counts neither its bytes nor its records', async () => {
        dataView.config = SIZED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        history.replaceState({ loadIsRequested: true }, '');
        vi.mocked(loadDataViewRecords).mockImplementationOnce((_config, _isDraft, onProgress) => {
            onProgress(120, undefined, undefined);
            return new Promise<never>(vi.fn());
        });
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'load.running.text', { duration: formatElapsedDuration(0), records: constructRecordsText(120) }));
        expect(wrapper.find('[role="progressbar"]').exists()).toBe(false);
    });

    it('says how far a stopped load got', async () => {
        dataView.config = SIZED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        history.replaceState({ loadIsRequested: true }, '');
        let clockTime = 1000;
        const clock = vi.spyOn(performance, 'now').mockImplementation(() => clockTime);
        const stopController = new AbortController(); // Stands for the engine, which ends the load when it is stopped.
        vi.mocked(abortDataViewRecordLoad).mockImplementation(() => {
            stopController.abort();
            return Promise.resolve();
        });
        vi.mocked(loadDataViewRecords).mockImplementationOnce((_config, _isDraft, onProgress) => {
            onProgress(120, 500, undefined);
            return new Promise<never>((_resolve, reject) => {
                stopController.signal.addEventListener('abort', () => {
                    reject(new Error('Aborted.'));
                });
            });
        });
        const wrapper = mountPanel();
        await settle();

        clockTime += 4000; // The load runs for 4 seconds before it is stopped.
        await wrapper
            .findAll('button')
            .find((button) => button.text() === t(TEXT, 'load.stop.label'))
            ?.trigger('click');
        await settle();
        clock.mockRestore();

        expect(wrapper.text()).toContain(t(TEXT, 'load.stopped.text'));
        expect(wrapper.text()).toContain(t(TEXT, 'load.stop.percentage.text', { duration: formatFinishedDuration(4000), percentage: formatStatusPercentage(50), records: constructRecordsText(120) }));
        expect(wrapper.find('[role="meter"]').attributes('aria-valuenow')).toBe('50');
    });

    it('warns, after the load’s figures, when the column types come from a partial audit', async () => {
        dataView.config = { ...AUDITED_DATA_VIEW, contentAuditConfig: { ...AUDITED_DATA_VIEW.contentAuditConfig, isComplete: false } };
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        history.replaceState({ loadIsRequested: true }, '');
        vi.mocked(loadDataViewRecords).mockResolvedValueOnce({ columnsHaveChanged: false, invalidValueCounts: [], recordCount: 2 });
        const wrapper = mountPanel();
        await settle();

        const text = wrapper.text();
        expect(text.indexOf(t(TEXT, 'load.partialAuditTypes.text'))).toBeGreaterThan(-1);
        expect(text.indexOf(t(TEXT, 'load.partialAuditTypes.text'))).toBeGreaterThan(text.indexOf(constructRecordsText(2)));
    });

    it('warns that the item has changed, and opens the item step to refresh the data view when asked', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        itemChange.changedAt = Date.UTC(2026, 10, 17);
        itemChange.isShown = true;
        const wrapper = mountPanel();
        await settle();

        const notice = wrapper.get('[data-region="ItemChangedNotice"]');
        expect(loadDataViewRecords).not.toHaveBeenCalled(); // Nothing is read again until the user asks.

        await notice.findAll('button').at(0)?.trigger('click'); // 'Refresh' comes first.

        expect(routerPush).toHaveBeenCalledWith(expect.objectContaining({ name: 'item', state: { itemRefreshIsRequested: true } }));
        expect(loadDataViewRecords).not.toHaveBeenCalled(); // The item step previews and audits first, then asks for the load.
    });

    it('ignores the change when asked, and says nothing when the item has not changed', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        const unchanged = mountPanel();
        await settle();
        expect(unchanged.find('[data-region="ItemChangedNotice"]').exists()).toBe(false);

        itemChange.changedAt = Date.UTC(2026, 10, 17);
        itemChange.isShown = true;
        const changed = mountPanel();
        await settle();
        await changed.get('[data-region="ItemChangedNotice"]').findAll('button').at(-1)?.trigger('click'); // 'Ignore' comes last.

        expect(itemChange.ignoreItemChange).toHaveBeenCalledOnce();
        expect(routerPush).not.toHaveBeenCalled();
    });

    it('shows the store the records are in, named for screen readers, in place of a load again button', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(listDataViewStoreConfigs).mockReturnValue(STORE_CONFIGS);
        const wrapper = mountPanel();
        await settle();

        const trigger = wrapper.find(`[aria-label="${t(TEXT, 'store.aria', { label: 'SQLite' })}"]`);
        expect(trigger.text()).toContain('SQLite');
        expect(wrapper.text()).not.toContain(t(TEXT, 'load.again.label'));
    });

    it('lists Auto first in the store menu, ticked while no store is chosen, naming the default store', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(listDataViewStoreConfigs).mockReturnValue(STORE_CONFIGS);
        const wrapper = mountPanel();
        await settle();

        await wrapper.get(`[aria-label="${t(TEXT, 'store.aria', { label: 'SQLite' })}"]`).trigger('click');
        const storeItems = wrapper.findAll('[role="menuitemradio"]');

        expect(storeItems.map((storeItem) => storeItem.text())).toEqual([t(TEXT, 'store.auto.label', { label: 'SQLite' }), 'DuckDB', 'PGlite', 'SQLite']);
        expect(storeItems.map((storeItem) => storeItem.attributes('aria-checked'))).toEqual(['true', 'false', 'false', 'false']);
    });

    it('keeps a store choice in the data view, and loads only when the records move to another store', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(listDataViewStoreConfigs).mockReturnValue(STORE_CONFIGS);
        const wrapper = mountPanel();
        await settle();
        const chooseStore = async (label: string): Promise<void> => {
            await wrapper.get(`[aria-label="${t(TEXT, 'store.aria', { label: 'SQLite' })}"]`).trigger('click');
            await wrapper
                .findAll('[role="menuitemradio"]')
                .find((storeItem) => storeItem.text() === label)
                ?.trigger('click');
            await settle();
        };

        await chooseStore('SQLite'); // Auto already means SQLite, so the records stay where they are.
        expect(changeDataView).toHaveBeenLastCalledWith(expect.objectContaining({ storeConnectorId: 'dpuse-connector-sqlite-wasm' }));
        expect(loadDataViewRecords).not.toHaveBeenCalled();

        await chooseStore('DuckDB');
        expect(changeDataView).toHaveBeenLastCalledWith(expect.objectContaining({ storeConnectorId: 'dpuse-connector-duckdb-wasm' }));
        expect(loadDataViewRecords).toHaveBeenCalledOnce();
    });

    it('says the data has not been loaded when the data view has never been loaded', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'load.required.text'));
    });

    it('shows the load’s total time, taken from its timed parts', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        history.replaceState({ loadIsRequested: true }, '');
        vi.mocked(findDataViewLoadTiming).mockReturnValue(LOAD_TIMING);
        vi.mocked(constructLoadTimingParts).mockReturnValue({ converting: 2000, other: 1000, parsing: 2500, reading: 4000, starting: 500, storing: 6000, total: 13_000, waiting: 1000 });
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'load.complete.zero.text', { duration: formatFinishedDuration(13_000) }));
    });

    it('shows no load time for records loaded on an earlier visit, only the records and where they went', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(queryDataViewRecords).mockResolvedValue({ records: [[7, new Date(Date.UTC(2026, 9, 28))]], totalCount: 2 });
        const wrapper = mountPanel();
        await settle();

        await (wrapper.findComponent(TableStub).props() as TableProperties).dataSource.getRows(0, 100);
        await settle();

        const records = constructRecordsText(2);
        expect(wrapper.text()).toContain(t(TEXT, 'load.untimed.other.text', { records }));
    });

    it('says so when another tab has the store, and tries again when asked', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(openDataViewStore).mockResolvedValueOnce('heldElsewhere');
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'store.heldElsewhere.text'));

        await wrapper
            .findAll('button')
            .find((button) => button.text() === t(TEXT, 'retry.label'))
            ?.trigger('click');
        await settle();

        expect(openDataViewStore).toHaveBeenCalledTimes(2);
        expect(wrapper.findComponent(TableStub).exists()).toBe(true);
    });

    it('takes the store over from another tab when asked to use it here', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(openDataViewStore).mockResolvedValueOnce('heldElsewhere');
        const wrapper = mountPanel();
        await settle();

        await wrapper
            .findAll('button')
            .find((button) => button.text() === t(TEXT, 'store.takeOver.label'))
            ?.trigger('click');
        await settle();
        expect(openDataViewStore).toHaveBeenCalledOnce(); // Asks first, because the other tab loses its loaded records.
        wrapper.findComponent({ name: 'ConfirmDialog' }).vm.$emit('confirm');
        await settle();

        expect(openDataViewStore).toHaveBeenLastCalledWith(expect.any(String), undefined, true);
        expect(wrapper.findComponent(TableStub).exists()).toBe(true);
    });

    it('says so at once when another tab takes the store over', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        const wrapper = mountPanel();
        await settle();

        storeTakeover.value = { connectorId: 'dpuse-connector-sqlite-wasm', takenAt: 1 };
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'store.heldElsewhere.text'));
        expect(wrapper.findComponent(TableStub).exists()).toBe(false);
    });

    it('says another tab has the store, rather than failing, when reading finds it taken', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(queryDataViewRecords).mockRejectedValue(constructStoreError('heldElsewhere', 'The store is open in another tab or window.', 'test'));
        const wrapper = mountPanel();
        await settle();

        await (wrapper.findComponent(TableStub).props() as TableProperties).dataSource.getRows(0, 100);
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'store.heldElsewhere.text'));
    });

    it('asks to load again, and forgets the load, when the store no longer has the records', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(queryDataViewRecords).mockRejectedValue(constructStoreError('notLoaded', "'dataView1' has not been loaded.", 'test'));
        const wrapper = mountPanel();
        await settle();

        await (wrapper.findComponent(TableStub).props() as TableProperties).dataSource.getRows(0, 100);
        await settle();

        expect(forgetDataViewLoad).toHaveBeenCalledWith(AUDITED_DATA_VIEW, false);
        expect(wrapper.text()).toContain(t(TEXT, 'load.required.text'));
    });

    it('says so when the browser has no storage for the store', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(openDataViewStore).mockResolvedValueOnce('unavailable');
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'store.unavailable.text'));
    });

    it('lets go of the store on leaving, so another tab can use it', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        const wrapper = mountPanel();
        await settle();
        wrapper.unmount();

        expect(storeUse.releaseStore).toHaveBeenCalledOnce();
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountPanel(): ReturnType<typeof mount> {
    return mount(InvestigateDataPanel, { global: { stubs: { Table: TableStub } } });
}

function constructRecordsText(recordCount: number): string {
    return t(TEXT, recordCount === 1 ? 'record.one.text' : 'record.other.text', { count: new Intl.NumberFormat(localeId.value).format(recordCount) });
}
