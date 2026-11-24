// ── External Dependencies & Registrations
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { defineComponent, h, type PropType, type SetupContext } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { EventQueryConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT as CONFIRM_DIALOG_TEXT } from '@/components/ui/dialog/ConfirmDialog_.json';
import { TEXT as EVENT_QUERY_LIST_TEXT } from '@/features/studio/eventQueries/EventQueryList_.json';
import { raiseAppFailure } from '@/state/errors';
import { settle } from '~/tests/support/settle';
import { t } from '@/state/locale';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

vi.mock('@/state/errors', async (importOriginal) => ({ ...(await importOriginal<object>()), raiseAppFailure: vi.fn() }));

// The list reads and deletes its event queries through these hooks, so the spec drives them directly: the refs below
// are the query and the mutation, and each test moves them the way a real delete would.
vi.mock('@/features/studio/eventQueries/_eventQueries', async () => {
    const { ref } = await import('vue');
    const state = {
        eventQueryConfigs: ref<EventQueryConfig[]>([]),
        deleteIsPending: ref(false),
        deleteEventQuery: vi.fn<(id: string) => Promise<void>>()
    };
    return {
        cancelEventQueryRetrieval: vi.fn(),
        useEventQueries: (): object => ({
            data: state.eventQueryConfigs,
            error: ref(null),
            isError: ref(false),
            isFetching: ref(false),
            isSuccess: ref(true),
            refetch: vi.fn()
        }),
        useDeleteEventQuery: (): object => ({ isPending: state.deleteIsPending, mutateAsync: state.deleteEventQuery }),
        stateForTest: state
    };
});

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface StateForTest {
    eventQueryConfigs: { value: EventQueryConfig[] };
    deleteIsPending: { value: boolean };
    deleteEventQuery: ReturnType<typeof vi.fn<(id: string) => Promise<void>>>;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The grid needs a measured layout that jsdom cannot give, so this stand-in only shows the selected event query's
// detail and an Add button.
const GridDetailPanelStub = {
    props: { selectedItem: { type: Object as PropType<LocalisedConfig<EventQueryConfig>>, default: undefined } },
    emits: ['add'],
    setup(properties: { selectedItem?: LocalisedConfig<EventQueryConfig> }, { emit, slots }: SetupContext<['add']>) {
        return (): ReturnType<typeof h> =>
            h('div', [
                h(
                    'button',
                    {
                        'data-test': 'add',
                        onClick: () => {
                            emit('add');
                        }
                    },
                    'Add'
                ),
                properties.selectedItem ? slots.detail?.({ item: properties.selectedItem, close: vi.fn() }) : undefined
            ]);
    }
};

// The detail panel stands in as its Delete button, which is all the list reads from it.
const EventQueryPanelStub = defineComponent({
    props: { isDeleting: { type: Boolean, default: false } },
    emits: ['delete'],
    setup(properties: { isDeleting: boolean }, { emit }: SetupContext<['delete']>) {
        return (): ReturnType<typeof h> =>
            h(
                'button',
                {
                    'data-test': 'delete',
                    disabled: properties.isDeleting,
                    onClick: () => {
                        emit('delete');
                    }
                },
                'Delete Event Query'
            );
    }
});

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('event query list', () => {
    beforeEach(async () => {
        const state = await getState();
        state.eventQueryConfigs.value = [buildEventQuery('a', 'Hires'), buildEventQuery('b', 'Sales')];
        state.deleteIsPending.value = false;
        state.deleteEventQuery.mockReset();
        vi.mocked(raiseAppFailure).mockClear();
        document.body.replaceChildren();
    });

    describe('adding', () => {
        it('opens the context diagram, where the event for a new event query is chosen', async () => {
            const router = await buildRouter();
            const wrapper = await mountList(router);

            await wrapper.get('[data-test="add"]').trigger('click');
            await settle();

            expect(router.currentRoute.value.name).toBe('eventQueryDiagram');
            wrapper.unmount();
        });
    });

    describe('deleting', () => {
        it('deletes nothing when the user cancels', async () => {
            const state = await getState();
            const router = await buildRouter();
            const wrapper = await mountList(router);

            await wrapper.get('[data-test="delete"]').trigger('click');
            await settle();
            findDialogButton(t(CONFIRM_DIALOG_TEXT, 'cancel.label')).click();
            await settle();

            expect(state.deleteEventQuery).not.toHaveBeenCalled();
            expect(router.currentRoute.value.params.eventQueryId).toBe('a');
            wrapper.unmount();
        });

        it('deletes the selected event query, clears it from the URL and moves focus to the message', async () => {
            const state = await getState();
            // The list drops the event query as soon as the delete resolves, as the cache update does.
            state.deleteEventQuery.mockImplementation((id) => {
                state.eventQueryConfigs.value = state.eventQueryConfigs.value.filter((config) => config.id !== id);
                return Promise.resolve();
            });
            const router = await buildRouter();
            const wrapper = await mountList(router);

            await wrapper.get('[data-test="delete"]').trigger('click');
            await settle();
            findDialogButton(t(EVENT_QUERY_LIST_TEXT, 'delete.confirm.label')).click();
            await settle();

            expect(state.deleteEventQuery).toHaveBeenCalledWith('a');
            expect(router.currentRoute.value.params.eventQueryId).toBeUndefined();
            expect(document.activeElement?.textContent).toBe(t(EVENT_QUERY_LIST_TEXT, 'delete.done.text', { name: 'Hires' }));
            wrapper.unmount();
        });

        it('reports a failed delete and keeps the event query selected', async () => {
            const state = await getState();
            state.deleteEventQuery.mockRejectedValue(new Error('Store unavailable.'));
            const router = await buildRouter();
            const wrapper = await mountList(router);

            await wrapper.get('[data-test="delete"]').trigger('click');
            await settle();
            findDialogButton(t(EVENT_QUERY_LIST_TEXT, 'delete.confirm.label')).click();
            await settle();

            expect(raiseAppFailure).toHaveBeenCalledOnce();
            expect(router.currentRoute.value.params.eventQueryId).toBe('a');
            wrapper.unmount();
        });

        it('shows the Delete button as busy while a delete is under way', async () => {
            const state = await getState();
            const router = await buildRouter();
            const wrapper = await mountList(router);

            state.deleteIsPending.value = true;
            await settle();

            expect(wrapper.get('[data-test="delete"]').attributes('disabled')).toBeDefined();
            wrapper.unmount();
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildEventQuery(id: string, label: string): EventQueryConfig {
    return { id, label: { en: label }, description: {}, icon: null, iconDark: null, typeId: 'eventQuery' } as EventQueryConfig;
}

async function getState(): Promise<StateForTest> {
    const module_ = (await import('@/features/studio/eventQueries/_eventQueries')) as unknown as { stateForTest: StateForTest };
    return module_.stateForTest;
}

async function buildRouter(): Promise<Router> {
    const component = { render: (): null => null };
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { name: 'eventQueryDiagram', path: '/eventQueries/diagram', component },
            { name: 'eventQueryList', path: '/eventQueries/list/:eventQueryId?', component }
        ]
    });
    await router.push('/eventQueries/list/a');
    await router.isReady();
    return router;
}

async function mountList(router: Router): Promise<VueWrapper> {
    const listModule = await import('@/features/studio/eventQueries/EventQueryList.vue');
    const wrapper = mount(listModule.default, {
        attachTo: document.body, // Focus only moves between elements in the document.
        global: {
            plugins: [router],
            stubs: { EventQueryPanel: EventQueryPanelStub, GridDetailPanel: GridDetailPanelStub }
        }
    });
    await settle();
    return wrapper;
}

function findDialogButton(label: string): HTMLButtonElement {
    const button = [...document.querySelectorAll<HTMLButtonElement>('[data-region="ConfirmDialog"] button')].find((candidate) => candidate.textContent.trim() === label);
    if (!button) throw new Error(`The confirm dialog has no '${label}' button.`);
    return button;
}
