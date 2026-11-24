// ── External Dependencies & Registrations
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, type PropType, type SetupContext, shallowRef, watchEffect } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { EventQueryConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import EventQueryList from '@/features/studio/eventQueries/EventQueryList.vue';
import { settle } from '~/tests/support/settle';
import { t } from '@/state/locale';
import { TEXT } from '@/features/studio/eventQueries/EventQueryList_.json';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type EventQueryDataSource = DataSource<LocalisedConfig<EventQueryConfig>>;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const EVENT_QUERY_LOCALISED_CONFIGS = [
    { id: 'a', label: 'Hires' },
    { id: 'b', label: 'Sales' }
] as LocalisedConfig<EventQueryConfig>[];

// The grid needs a measured layout that jsdom cannot give, so this stand-in shows every row the list hands it, the
// list's slow-retrieval notice while the row count is unknown, and an Add button, as the grid does.
const GridStub = {
    props: { dataSource: { type: Object as PropType<EventQueryDataSource>, default: undefined } },
    emits: ['add'],
    setup(properties: { dataSource?: EventQueryDataSource }, { emit, slots }: SetupContext<['add']>) {
        const rows = shallowRef<LocalisedConfig<EventQueryConfig>[]>([]);
        watchEffect(() => {
            const { dataSource } = properties;
            if (dataSource == null) return;
            if ('rows' in dataSource) rows.value = dataSource.rows;
            else void dataSource.getRows(0, dataSource.rowCount ?? 0).then((result) => (rows.value = result.rows));
        });
        return (): ReturnType<typeof h> =>
            h('div', { 'data-row-count': String(properties.dataSource?.rowCount) }, [
                h('button', {
                    'data-test': 'add',
                    onClick: () => {
                        emit('add');
                    }
                }),
                properties.dataSource?.rowCount === undefined ? slots.busy?.() : undefined,
                ...rows.value.map((item) => slots.default?.({ item }))
            ]);
    }
};

// The card has its own look, so it stands in as a button that selects it.
const ConfigCardStub = {
    props: {
        config: { type: Object as PropType<LocalisedConfig<EventQueryConfig>>, default: undefined },
        isInert: Boolean,
        selected: Boolean
    },
    emits: ['click'],
    setup(properties: { config?: LocalisedConfig<EventQueryConfig>; isInert?: boolean; selected?: boolean }, { emit }: SetupContext<['click']>) {
        return (): ReturnType<typeof h> =>
            h('button', {
                'data-card': properties.config?.id,
                'data-inert': String(properties.isInert),
                'data-selected': String(properties.selected),
                onClick: () => {
                    emit('click');
                }
            });
    }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('event query list', () => {
    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
    });

    it('shows a card for every event query once retrieval has settled', async () => {
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
        const buttons = wrapper.findAll('[role="status"] + div button');
        expect(buttons.map((button) => button.text())).toStrictEqual([t(TEXT, 'retrieval.cancel.label'), t(TEXT, 'retrieval.retry.label')]);

        await buttons[0]?.trigger('click');
        await buttons[1]?.trigger('click');

        expect(wrapper.emitted('cancelRetrieval')).toHaveLength(1);
        expect(wrapper.emitted('retryRetrieval')).toHaveLength(1);
    });

    it('marks the selected card, and makes it inert only when its detail shows beside the list', async () => {
        const wrapper = await mountList({ selectedEventQueryId: 'b' });
        const card = wrapper.get('[data-card="b"]');

        expect(card.attributes('data-selected')).toBe('true');
        expect(card.attributes('data-inert')).toBe('false');
        expect(wrapper.get('[data-card="a"]').attributes('data-selected')).toBe('false');

        await wrapper.setProps({ isSplit: true });

        expect(card.attributes('data-inert')).toBe('true');
        expect(wrapper.get('[data-card="a"]').attributes('data-inert')).toBe('false');
    });

    it('hands the event query of a clicked card to its parent, and asks it for a new one from Add', async () => {
        const wrapper = await mountList({});

        await wrapper.get('[data-card="b"]').trigger('click');
        await wrapper.get('[data-test="add"]').trigger('click');

        expect(wrapper.emitted('select')).toStrictEqual([[EVENT_QUERY_LOCALISED_CONFIGS[1]]]);
        expect(wrapper.emitted('add')).toHaveLength(1);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function mountList(overrides: { isSplit?: boolean; retrievalIsSettled?: boolean; retrievalIsSlow?: boolean; selectedEventQueryId?: string }): Promise<VueWrapper> {
    const wrapper = mount(EventQueryList, {
        props: {
            eventQueryLocalisedConfigs: EVENT_QUERY_LOCALISED_CONFIGS,
            isSplit: false,
            retrievalIsSettled: true,
            retrievalIsSlow: false,
            selectedEventQueryId: undefined,
            ...overrides
        },
        global: { stubs: { ConfigCard: ConfigCardStub, Grid: GridStub } }
    });
    wrappers.push(wrapper);
    await settle();
    return wrapper;
}
