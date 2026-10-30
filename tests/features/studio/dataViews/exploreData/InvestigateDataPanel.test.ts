// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, type VNode } from 'vue';

// ── Local Framework
import InvestigateDataPanel from '@/features/studio/dataViews/exploreData/InvestigateDataPanel.vue';
import { settle } from '~/tests/support/settle';
import { TEXT } from '@/features/studio/dataViews/exploreData/InvestigateDataPanel_.json';
import { closeDataViewStore, findDataViewStoreLabel, isDataViewLoaded, loadDataViewRecords, openDataViewStore, queryDataViewRecords } from '@/features/studio/dataViews/_dataViewStore';
import { localeId, t } from '@/state/locale';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The panel reads the data view the route names. The spec sets that data view directly.
const dataView = vi.hoisted((): { config: unknown } => ({ config: undefined }));
vi.mock('@/features/studio/dataViews/_dataViews', async (importOriginal) => {
    const { computed } = await import('vue');
    return {
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
        ...(await importOriginal<typeof import('@/features/studio/dataViews/_dataViews')>()),
        useDataView: (): { data: unknown } => ({ data: computed(() => dataView.config) })
    };
});
vi.mock('@/features/studio/dataViews/_dataViewStore', () => ({
    abortDataViewRecordLoad: vi.fn(),
    closeDataViewStore: vi.fn(),
    findDataViewStoreLabel: vi.fn(),
    isDataViewLoaded: vi.fn(),
    loadDataViewRecords: vi.fn(),
    openDataViewStore: vi.fn(),
    queryDataViewRecords: vi.fn()
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
    contentAuditConfig: {
        asAt: 1,
        columns: [
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
    vi.mocked(loadDataViewRecords).mockResolvedValue();
});

afterEach(() => {
    dataView.config = undefined;
    vi.clearAllMocks();
});

describe('InvestigateDataPanel', () => {
    it('asks for an audit, and opens no store, when the data view has none', async () => {
        dataView.config = { contentAuditConfig: undefined, id: 'dataView1' };
        const wrapper = mountPanel();
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'audit.required.text'));
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

    it('loads a data view that is not loaded yet, then shows it', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        const wrapper = mountPanel();
        await settle();

        expect(loadDataViewRecords).toHaveBeenCalledOnce();
        expect(wrapper.findComponent(TableStub).exists()).toBe(true);
    });

    it('shows which store a load went into, and how long it took, beside "Load again"', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
        let clockTime = 1000;
        const clock = vi.spyOn(performance, 'now').mockImplementation(() => clockTime);
        vi.mocked(loadDataViewRecords).mockImplementationOnce(() => {
            clockTime += 12_500;
            return Promise.resolve();
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

        await wrapper.findAll('button').find((button) => button.text() === t(TEXT, 'retry.label'))?.trigger('click');
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
