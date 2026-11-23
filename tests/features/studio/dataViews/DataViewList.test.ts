// ── External Dependencies & Registrations
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, type PropType, type SetupContext, shallowRef, watchEffect } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import DataViewList from '@/features/studio/dataViews/DataViewList.vue';
import { settle } from '~/tests/support/settle';
import { t } from '@/state/locale';
import { TEXT } from '@/features/studio/dataViews/DataViewList_.json';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type DataViewDataSource = DataSource<LocalisedConfig<DataViewConfig>>;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_VIEW_LOCALISED_CONFIGS = [
    { id: 'a', label: 'Sales' },
    { id: 'b', label: 'Stock' }
] as LocalisedConfig<DataViewConfig>[];

// The grid needs a measured layout that jsdom cannot give, so this stand-in shows every row the list hands it, and the
// list's slow-retrieval notice while the row count is unknown, as the grid does.
const GridStub = {
    props: { dataSource: { type: Object as PropType<DataViewDataSource>, default: undefined } },
    setup(properties: { dataSource?: DataViewDataSource }, { slots }: SetupContext) {
        const rows = shallowRef<LocalisedConfig<DataViewConfig>[]>([]);
        watchEffect(() => {
            const { dataSource } = properties;
            if (dataSource == null) return;
            if ('rows' in dataSource) rows.value = dataSource.rows;
            else void dataSource.getRows(0, dataSource.rowCount ?? 0).then((result) => (rows.value = result.rows));
        });
        return (): ReturnType<typeof h> =>
            h('div', { 'data-row-count': String(properties.dataSource?.rowCount) }, [
                properties.dataSource?.rowCount === undefined ? slots.busy?.() : undefined,
                ...rows.value.map((item) => slots.default?.({ item }))
            ]);
    }
};

// The card has its own look, so it stands in as a button to select it and a button to open it.
const DataViewCardStub = {
    props: {
        dataViewLocalisedConfig: { type: Object as PropType<LocalisedConfig<DataViewConfig>>, default: undefined },
        isInert: Boolean,
        selected: Boolean
    },
    emits: ['click', 'open'],
    setup(properties: { dataViewLocalisedConfig?: LocalisedConfig<DataViewConfig>; isInert?: boolean; selected?: boolean }, { emit }: SetupContext<['click', 'open']>) {
        return (): ReturnType<typeof h> =>
            h('div', { 'data-card': properties.dataViewLocalisedConfig?.id, 'data-inert': String(properties.isInert), 'data-selected': String(properties.selected) }, [
                h('button', {
                    'data-test': 'select',
                    onClick: () => {
                        emit('click');
                    }
                }),
                h('button', {
                    'data-test': 'open',
                    onClick: () => {
                        emit('open');
                    }
                })
            ]);
    }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('data view list', () => {
    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
    });

    it('shows a card for every data view once retrieval has settled', async () => {
        const wrapper = await mountList({});

        expect(wrapper.findAll('[data-card]').map((card) => card.attributes('data-card'))).toStrictEqual(['a', 'b']);
    });

    it('keeps the list busy, with no row count, until retrieval settles', async () => {
        const wrapper = await mountList({ retrievalIsSettled: false });

        expect(wrapper.attributes('data-row-count')).toBe('undefined');
        expect(wrapper.find('[role="status"]').exists()).toBe(false);
    });

    it('says a slow retrieval is slow, and offers to cancel it or try again', async () => {
        const wrapper = await mountList({ retrievalIsSettled: false, retrievalIsSlow: true });

        expect(wrapper.get('[role="status"]').text()).toBe(t(TEXT, 'retrieval.slow.text'));
        const buttons = wrapper.findAll('button');
        expect(buttons.map((button) => button.text())).toStrictEqual([t(TEXT, 'retrieval.cancel.label'), t(TEXT, 'retrieval.retry.label')]);

        await buttons[0]?.trigger('click');
        await buttons[1]?.trigger('click');

        expect(wrapper.emitted('cancelRetrieval')).toHaveLength(1);
        expect(wrapper.emitted('retryRetrieval')).toHaveLength(1);
    });

    it('marks the selected card, and makes it inert only when its detail shows beside the list', async () => {
        const wrapper = await mountList({ selectedDataViewId: 'b' });
        const card = wrapper.get('[data-card="b"]');

        expect(card.attributes('data-selected')).toBe('true');
        expect(card.attributes('data-inert')).toBe('false');
        expect(wrapper.get('[data-card="a"]').attributes('data-selected')).toBe('false');

        await wrapper.setProps({ isSplit: true });

        expect(card.attributes('data-inert')).toBe('true');
        expect(wrapper.get('[data-card="a"]').attributes('data-inert')).toBe('false');
    });

    it('hands the data view of a clicked or opened card to its parent', async () => {
        const wrapper = await mountList({});
        const card = wrapper.get('[data-card="b"]');

        await card.get('[data-test="select"]').trigger('click');
        await card.get('[data-test="open"]').trigger('click');

        expect(wrapper.emitted('select')).toStrictEqual([[DATA_VIEW_LOCALISED_CONFIGS[1]]]);
        expect(wrapper.emitted('open')).toStrictEqual([[DATA_VIEW_LOCALISED_CONFIGS[1]]]);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function mountList(overrides: { isSplit?: boolean; retrievalIsSettled?: boolean; retrievalIsSlow?: boolean; selectedDataViewId?: string }): Promise<VueWrapper> {
    const wrapper = mount(DataViewList, {
        props: {
            dataViewLocalisedConfigs: DATA_VIEW_LOCALISED_CONFIGS,
            isSplit: false,
            retrievalIsSettled: true,
            retrievalIsSlow: false,
            selectedDataViewId: undefined,
            ...overrides
        },
        global: { stubs: { DataViewCard: DataViewCardStub, Grid: GridStub } }
    });
    wrappers.push(wrapper);
    await settle();
    return wrapper;
}
