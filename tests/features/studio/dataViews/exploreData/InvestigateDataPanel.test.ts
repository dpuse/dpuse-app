// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, type VNode } from 'vue';
import { mount, RouterLinkStub } from '@vue/test-utils';

// ── Local Framework
import ColumnDetailPanel from '@/features/studio/dataViews/ColumnDetailPanel.vue';
import { constructFittedColumnWidth } from '@/components/ui/table/tableColumnWidth';
import InvestigateDataPanel from '@/features/studio/dataViews/exploreData/InvestigateDataPanel.vue';
import { settle } from '~/tests/support/settle';
import { TEXT } from '@/features/studio/dataViews/exploreData/InvestigateDataPanel_.json';
import {
    closeDataViewStore,
    findDataViewInvalidValueCounts,
    findDataViewStoreLabel,
    hasDataViewLoad,
    isDataViewLoaded,
    loadDataViewRecords,
    openDataViewStore,
    queryDataViewColumnValueCounts,
    queryDataViewRecords
} from '@/features/studio/dataViews/_dataViewStore';
import { localeId, t } from '@/state/locale';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface TableProperties {
    columnDefinitions: { accessorKey: string; header: string; size: number }[];
    constructCellClass: (columnId: string) => string | undefined;
    dataSource: { getRows: (startRow: number, endRow: number) => Promise<{ rows: Record<string, string>[]; totalCount: number }> };
}

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

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
vi.mock('@/features/studio/dataViews/_dataViewStore', () => ({
    abortDataViewRecordLoad: vi.fn(),
    closeDataViewStore: vi.fn(),
    constructStoredColumnConfigs: (): { label: string }[] => STORED_COLUMN_CONFIGS,
    findDataViewInvalidValueCounts: vi.fn(),
    findDataViewStoreLabel: vi.fn(),
    hasDataViewLoad: vi.fn(),
    isDataViewLoaded: vi.fn(),
    listDataViewStoreConnections: vi.fn(() => []),
    loadDataViewRecords: vi.fn(),
    openDataViewStore: vi.fn(),
    queryDataViewColumnValueCounts: vi.fn(),
    queryDataViewRecords: vi.fn(),
    resolveDataViewTablePath: ({ id }: { id: string }): string => id,
    resolveStoreConnectorId: (): string => 'dpuse-connector-sqlite-wasm'
}));
vi.mock('@/components/ui/table/tableColumnWidth', () => ({ HEADER_MENU_WIDTH_PX: 24, HEADER_TAB_INSET_PX: 10, constructFittedColumnWidth: vi.fn() }));

vi.mock('vue-router', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('vue-router')>()),
    useRoute: (): { params: { dataViewId: string } } => ({ params: { dataViewId: 'dataView1' } })
}));

// The table scrolls and measures, which jsdom cannot, so it is stood in for and what it is given is checked. It renders
// each column's name through the panel's own 'header-label' slot, so a column's detail can be opened from it.
const TableStub = defineComponent({
    props: {
        columnDefinitions: { type: Array<{ accessorKey: string }>, required: true },
        constructCellClass: { type: Function, required: true },
        dataSource: { type: Object, required: true }
    },
    setup:
        (properties, { slots }) =>
        (): VNode =>
            h(
                'div',
                properties.columnDefinitions.map((columnDefinition) => slots['header-label']?.({ columnId: columnDefinition.accessorKey }))
            )
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
const STORED_COLUMN_CONFIGS = [{ label: 'Stored' }]; // Stands for the columns the store module works out, which the panel passes on to every query.

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.mocked(openDataViewStore).mockResolvedValue('ready');
    vi.mocked(closeDataViewStore).mockResolvedValue();
    vi.mocked(findDataViewStoreLabel).mockReturnValue('SQLite');
    vi.mocked(isDataViewLoaded).mockReturnValue(true);
    vi.mocked(hasDataViewLoad).mockReturnValue(false);
    vi.mocked(loadDataViewRecords).mockResolvedValue({ columnsHaveChanged: false, invalidValueCounts: [], recordCount: 0 });
    vi.mocked(findDataViewInvalidValueCounts).mockReturnValue(undefined);
});

afterEach(() => {
    dataView.config = undefined;
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

    it('shows which store a load went into, and how long it took, in the status bar', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        history.replaceState({ loadIsRequested: true }, '');
        let clockTime = 1000;
        const clock = vi.spyOn(performance, 'now').mockImplementation(() => clockTime);
        vi.mocked(loadDataViewRecords).mockImplementationOnce(() => {
            clockTime += 12_500;
            return Promise.resolve({ columnsHaveChanged: false, invalidValueCounts: [], recordCount: 0 });
        });
        const wrapper = mountPanel();
        await settle();
        clock.mockRestore();

        const seconds = new Intl.NumberFormat(localeId.value, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(12.5);
        expect(wrapper.text()).toContain(t(TEXT, 'load.duration.text', { seconds, store: 'SQLite' }));
    });

    it('shows no load time for records loaded on an earlier visit', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.text()).not.toContain('SQLite');
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

    it('says so when the browser has no storage for the store', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(openDataViewStore).mockResolvedValueOnce('unavailable');
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'store.unavailable.text'));
    });

    it('closes the store on leaving, so another tab can use it', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        const wrapper = mountPanel();
        await settle();
        wrapper.unmount();

        expect(closeDataViewStore).toHaveBeenCalledOnce();
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountPanel(): ReturnType<typeof mount> {
    return mount(InvestigateDataPanel, { global: { stubs: { Table: TableStub } } });
}
