// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, type VNode } from 'vue';

// ── Local Framework
import InvestigateDataPanel from '@/features/studio/dataViews/exploreData/InvestigateDataPanel.vue';
import { settle } from '~/tests/support/settle';
import { TEXT } from '@/features/studio/dataViews/exploreData/InvestigateDataPanel_.json';
import {
    closeDataViewStore,
    findDataViewStoreLabel,
    hasDataViewLoad,
    isDataViewLoaded,
    loadDataViewRecords,
    openDataViewStore,
    queryDataViewRecords
} from '@/features/studio/dataViews/_dataViewStore';
import { localeId, t } from '@/state/locale';

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
    findDataViewStoreLabel: vi.fn(),
    hasDataViewLoad: vi.fn(),
    isDataViewLoaded: vi.fn(),
    loadDataViewRecords: vi.fn(),
    openDataViewStore: vi.fn(),
    queryDataViewRecords: vi.fn(),
    resolveDataViewTablePath: (dataViewId: string): string => dataViewId
}));
vi.mock('vue-router', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('vue-router')>()),
    useRoute: (): { params: { dataViewId: string } } => ({ params: { dataViewId: 'dataView1' } })
}));

// The table scrolls and measures, which jsdom cannot, so it is stood in for and what it is given is checked.
const renderNothing = (): VNode => h('div');
const TableStub = defineComponent({
    props: { columnDefinitions: { type: Array, required: true }, dataSource: { type: Object, required: true } },
    setup: () => renderNothing
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

interface TableProperties {
    columnDefinitions: { accessorKey: string; header: string }[];
    dataSource: { getRows: (startRow: number, endRow: number) => Promise<{ rows: Record<string, string>[]; totalCount: number }> };
}

const AUDITED_DATA_VIEW = {
    columnSetConfig: {
        asAt: 1,
        columnConfigs: [
            { dataSubtypeId: 'integer', dataTypeId: 'numeric', label: { en: 'Id' } },
            { dataSubtypeId: 'date', dataTypeId: 'temporal', label: { en: 'Day' } }
        ]
    },
    id: 'dataView1'
};

function mountPanel(): ReturnType<typeof mount> {
    return mount(InvestigateDataPanel, { global: { stubs: { Table: TableStub } } });
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.mocked(openDataViewStore).mockResolvedValue('ready');
    vi.mocked(closeDataViewStore).mockResolvedValue();
    vi.mocked(findDataViewStoreLabel).mockReturnValue('SQLite');
    vi.mocked(isDataViewLoaded).mockReturnValue(true);
    vi.mocked(hasDataViewLoad).mockReturnValue(false);
    vi.mocked(loadDataViewRecords).mockResolvedValue({ columnsHaveChanged: false, invalidValueCounts: [], recordCount: 0 });
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
        dataView.config = { columnSetConfig: undefined, id: 'dataView1' };
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
        expect(queryDataViewRecords).toHaveBeenCalledWith('dataView1', { aggregates: [], filters: [], groupColumnIndexes: [], limit: 100, offset: 0, sorts: [] });
        const expectedDateText = new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium', timeZone: 'UTC' }).format(Date.UTC(2026, 9, 28));
        expect(page).toEqual({ rows: [{ c0: '7', c1: expectedDateText }], totalCount: 1 });
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

    it('shows how many values did not fit, by column', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        vi.mocked(loadDataViewRecords).mockResolvedValue({ columnsHaveChanged: false, invalidValueCounts: [312, 0], recordCount: 400 });
        history.replaceState({ loadIsRequested: true }, '');
        const wrapper = mountPanel();
        await settle();

        const count = new Intl.NumberFormat(localeId.value).format(312);
        expect(wrapper.text()).toContain(t(TEXT, 'invalid.text', { count, label: 'Id' }));
        expect(wrapper.text()).not.toContain('Day');
    });

    it('shows which store a load went into, and how long it took, beside "Load again"', async () => {
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

        expect(wrapper.find('span.text-muted').exists()).toBe(false);
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
