// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, type VNode } from 'vue';

// ── Local Framework
import InvestigateDataPanel from '@/features/studio/dataViews/exploreData/InvestigateDataPanel.vue';
import { raiseAppFailure } from '@/state/errors';
import { retrieveDataViewRecordRange } from '@/services/metaStore';
import { settle } from '~/tests/support/settle';
import { TEXT } from '@/features/studio/dataViews/exploreData/InvestigateDataPanel_.json';
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
vi.mock('vue-router', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('vue-router')>()),
    useRoute: (): { params: { dataViewId: string } } => ({ params: { dataViewId: 'dataView1' } })
}));
vi.mock('@/services/metaStore', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/services/metaStore')>()),
    retrieveDataViewRecordRange: vi.fn()
}));
vi.mock('@/state/errors', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/state/errors')>()),
    raiseAppFailure: vi.fn()
}));

// The table scrolls and measures, which jsdom cannot, so it is stood in for and what it is given is checked.
const renderNothing = (): VNode => h('div');
const TableStub = defineComponent({
    props: { columnDefinitions: { type: Array, required: true }, dataSource: { type: Object, required: true } },
    setup: () => renderNothing
});

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface TableProperties {
    columnDefinitions: { accessorKey: string; header: string }[];
    dataSource: { getRows: (startRow: number, endRow: number) => Promise<{ rows: Record<string, string>[]; totalCount: number }> };
}

const AUDITED_DATA_VIEW = {
    contentAuditConfig: {
        asAt: 1,
        columns: [
            { dataSubtypeId: 'integer', dataTypeId: 'numeric', label: { en: 'Id' } },
            { dataSubtypeId: 'date', dataTypeId: 'temporal', label: { en: 'Hired' } },
            { dataSubtypeId: 'bigint', dataTypeId: 'numeric', label: { en: 'Big' } },
            { dataSubtypeId: undefined, dataTypeId: 'boolean', label: { en: 'Active' } },
            { dataSubtypeId: 'plain', dataTypeId: 'string', label: {} }
        ]
    },
    id: 'dataView1'
};

async function mountPanel(): Promise<TableProperties | undefined> {
    const wrapper = mount(InvestigateDataPanel, { global: { stubs: { Table: TableStub } } });
    await settle();
    const table = wrapper.findComponent(TableStub);
    return table.exists() ? (table.props() as unknown as TableProperties) : undefined;
}

afterEach(() => {
    dataView.config = undefined;
    vi.mocked(retrieveDataViewRecordRange).mockReset();
    vi.mocked(raiseAppFailure).mockReset();
});

describe('InvestigateDataPanel', () => {
    it('asks for an audit when the data view has none', async () => {
        dataView.config = { contentAuditConfig: undefined, id: 'dataView1' };
        const wrapper = mount(InvestigateDataPanel, { global: { stubs: { Table: TableStub } } });
        await settle();

        expect(wrapper.findComponent(TableStub).exists()).toBe(false);
        expect(wrapper.text()).toContain(t(TEXT, 'audit.required.text'));
    });

    it('names a column for each audited column, by its position', async () => {
        dataView.config = AUDITED_DATA_VIEW;

        const tableProperties = await mountPanel();

        expect(tableProperties?.columnDefinitions.map(({ accessorKey, header }) => [accessorKey, header])).toEqual([
            ['c1', 'Id'],
            ['c2', 'Hired'],
            ['c3', 'Big'],
            ['c4', 'Active'],
            ['c5', '5']
        ]);
    });

    it("reads each block from the data view's table, and shows each value as text", async () => {
        dataView.config = AUDITED_DATA_VIEW;
        const hired = new Date(2024, 2, 12);
        vi.mocked(retrieveDataViewRecordRange).mockResolvedValue({ records: [{ c1: 1, c2: hired, c3: 9_007_199_254_740_993n, c4: true, c5: null }], totalCount: 250 });
        const tableProperties = await mountPanel();

        const block = await tableProperties?.dataSource.getRows(100, 200);

        expect(retrieveDataViewRecordRange).toHaveBeenCalledWith('dataView1', { limit: 100, offset: 100 });
        expect(block).toEqual({
            rows: [{ c1: '1', c2: new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium' }).format(hired), c3: '9007199254740993', c4: 'true', c5: '' }],
            totalCount: 250
        });
    });

    it('reports a failure to read the records, and shows none', async () => {
        dataView.config = AUDITED_DATA_VIEW;
        vi.mocked(retrieveDataViewRecordRange).mockRejectedValue(new Error('Store gone.'));
        const tableProperties = await mountPanel();

        expect(await tableProperties?.dataSource.getRows(0, 100)).toEqual({ rows: [], totalCount: 0 });
        expect(raiseAppFailure).toHaveBeenCalledOnce();
    });
});
