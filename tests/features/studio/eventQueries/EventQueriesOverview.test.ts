// ── External Dependencies & Registrations
import type { Ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { defineComponent, h, type PropType, type SetupContext } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig, EventQueryConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT as CONFIRM_DIALOG_TEXT } from '@/components/ui/dialog/ConfirmDialog_.json';
import { TEXT as OVERVIEW_TEXT } from '@/features/studio/eventQueries/EventQueriesOverview_.json';
import { raiseAppFailure } from '@/state/errors';
import { settle } from '~/tests/support/settle';
import { t } from '@/state/locale';
import { contextConfig, contextConfigStatus } from '@/state/configs';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

vi.mock('@/state/errors', async (importOriginal) => ({ ...(await importOriginal<object>()), raiseAppFailure: vi.fn() }));

// The focused model loads through the query client, so it is set here as already arrived.
vi.mock('@/state/contextModels', async (importOriginal) => {
    const { ref } = await import('vue');
    const modelConfig = ref({
        entities: [{ id: 'person', label: { en: 'Person' }, events: [{ id: 'activation', labelAction: { en: 'Birth' } }] }]
    } as unknown as ContextModelConfig);
    return { ...(await importOriginal<object>()), useContextModel: (): object => ({ data: modelConfig, isFetching: ref(false) }) };
});

// The overview reads, adds and deletes its event queries through these hooks, so the spec drives them directly: the refs
// below are the query and the mutations, and each test moves them the way a real change would. A new event query is
// built for real.
vi.mock('@/features/studio/eventQueries/_eventQueries', async (importOriginal) => {
    const { ref } = await import('vue');
    const state = {
        eventQueryConfigs: ref<EventQueryConfig[]>([]),
        deleteIsPending: ref(false),
        deleteEventQuery: vi.fn<(id: string) => Promise<void>>(),
        addEventQuery: vi.fn<(config: EventQueryConfig) => Promise<EventQueryConfig>>()
    };
    return {
        ...(await importOriginal<object>()),
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
        useUpdateEventQuery: (): object => ({ isPending: ref(false), mutateAsync: state.addEventQuery }),
        stateForTest: state
    };
});

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface StateForTest {
    eventQueryConfigs: Ref<EventQueryConfig[]>;
    deleteIsPending: Ref<boolean>;
    deleteEventQuery: ReturnType<typeof vi.fn<(id: string) => Promise<void>>>;
    addEventQuery: ReturnType<typeof vi.fn<(config: EventQueryConfig) => Promise<EventQueryConfig>>>;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONTEXT_CONFIG = {
    id: 'context',
    label: { en: 'Context' },
    description: {},
    areas: [{ id: 'hr', label: { en: 'Human Resource' }, description: {}, models: [{ id: 'workforce', label: { en: 'Workforce' }, description: {} }] }]
} as unknown as ContextConfig;

const BIRTH_REFERENCE = { areaId: 'hr', modelId: 'workforce', entityId: 'person', eventId: 'activation' };
const BIRTH_DIAGRAM_PATH = '/eventQueries/diagram/hr/workforce/person/activation';

// The panes need a measured layout that jsdom cannot give, so this stand-in shows the left pane's content, the selected
// item's detail and its action, or the placeholder when nothing is selected.
const MasterDetailPanelStub = {
    props: { selectedItem: { type: Object as PropType<{ id: string }>, default: undefined } },
    setup(properties: { selectedItem?: { id: string } }, { slots }: SetupContext) {
        return (): ReturnType<typeof h> =>
            h('div', [
                slots.master?.({ isSplit: true, openDetail: vi.fn() }),
                ...(properties.selectedItem
                    ? [slots.detail?.({ item: properties.selectedItem, close: vi.fn() }), slots['detail-action']?.({ item: properties.selectedItem })]
                    : [slots['no-selection']?.()])
            ]);
    }
};

// The list and the diagram have their own tests, so each route stands in as a button that selects the event query 'b',
// and a button that asks for a new one: from the list with nothing more, and from the diagram for the Birth event.
const EventQueryListStub = constructViewStub('list');
const EventQueryDiagramStub = constructViewStub('diagram');

// The event query's panel stands in as its Delete button, which is all the overview reads from it.
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

// The context part's panel has its own tests, so it stands in as the id of the part it shows.
const ContextPartDetailStub = {
    props: { areaConfig: { type: Object, default: undefined }, eventConfig: { type: Object, default: undefined }, eventQueryLocalisedConfigs: { type: Array, default: undefined } },
    setup(properties: { areaConfig?: { id: string }; eventConfig?: { id: string }; eventQueryLocalisedConfigs?: { id: string }[] }) {
        return (): ReturnType<typeof h> =>
            h(
                'div',
                { 'data-test': 'context-part', 'data-event-queries': properties.eventQueryLocalisedConfigs?.map((config) => config.id).join(',') },
                properties.eventConfig?.id ?? properties.areaConfig?.id
            );
    }
};

// The name and description fields stand in as one input for the name, which is all the dialog needs.
const StudioDescriptorsPanelStub = {
    props: { label: { type: String, default: '' } },
    emits: ['update:label'],
    setup(properties: { label?: string }) {
        return (): ReturnType<typeof h> => h('input', { 'data-test': 'label', value: properties.label });
    }
};

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('event queries overview', () => {
    beforeEach(async () => {
        const state = await getState();
        state.eventQueryConfigs.value = [buildEventQuery('a', 'Hires'), buildEventQuery('b', 'Sales')];
        state.deleteIsPending.value = false;
        state.deleteEventQuery.mockReset();
        state.addEventQuery.mockReset();
        vi.mocked(raiseAppFailure).mockClear();
        contextConfig.value = CONTEXT_CONFIG;
        contextConfigStatus.value = { typeId: 'ready' };
        document.body.replaceChildren();
    });

    afterEach(() => {
        contextConfig.value = undefined;
        contextConfigStatus.value = { typeId: 'pending' };
    });

    describe('detail', () => {
        it('asks for a selection while the list has none', async () => {
            const wrapper = await mountOverview(await buildRouter('/eventQueries/list'));

            expect(wrapper.text()).toContain(t(OVERVIEW_TEXT, 'noSelection.text'));
            wrapper.unmount();
        });

        it('shows the selected event query’s panel, in either view', async () => {
            const listWrapper = await mountOverview(await buildRouter('/eventQueries/list/a'));
            expect(listWrapper.find('[data-test="delete"]').exists()).toBe(true);
            listWrapper.unmount();

            const diagramWrapper = await mountOverview(await buildRouter(`${BIRTH_DIAGRAM_PATH}/a`));
            expect(diagramWrapper.find('[data-test="delete"]').exists()).toBe(true);
            diagramWrapper.unmount();
        });

        it('shows the part of the context the diagram is drilled down to, with an event’s own event queries', async () => {
            const wrapper = await mountOverview(await buildRouter(BIRTH_DIAGRAM_PATH));
            const part = wrapper.get('[data-test="context-part"]');

            expect(part.text()).toBe('activation');
            expect(part.attributes('data-event-queries')).toBe('a,b');
            wrapper.unmount();
        });

        it('shows nothing but the placeholder at the top of the diagram', async () => {
            const wrapper = await mountOverview(await buildRouter('/eventQueries/diagram'));

            expect(wrapper.find('[data-test="context-part"]').exists()).toBe(false);
            expect(wrapper.text()).toContain(t(OVERVIEW_TEXT, 'noSelection.diagram.text'));
            wrapper.unmount();
        });
    });

    describe('selecting', () => {
        it('selects an event query from the diagram under its event, and from the list by id', async () => {
            const diagramRouter = await buildRouter('/eventQueries/diagram');
            const diagramWrapper = await mountOverview(diagramRouter);
            await diagramWrapper.get('[data-test="diagram"]').trigger('click');
            await settle();
            expect(diagramRouter.currentRoute.value.path).toBe(`${BIRTH_DIAGRAM_PATH}/b`);
            diagramWrapper.unmount();

            const listRouter = await buildRouter('/eventQueries/list');
            const listWrapper = await mountOverview(listRouter);
            await listWrapper.get('[data-test="list"]').trigger('click');
            await settle();
            expect(listRouter.currentRoute.value.path).toBe('/eventQueries/list/b');
            listWrapper.unmount();
        });
    });

    describe('adding', () => {
        it('opens the context diagram from the list, where the event for a new event query is chosen', async () => {
            const router = await buildRouter('/eventQueries/list');
            const wrapper = await mountOverview(router);

            await wrapper.get('[data-test="list-add"]').trigger('click');
            await settle();

            expect(router.currentRoute.value.name).toBe('eventQueryDiagram');
            wrapper.unmount();
        });

        it('names a new event query after its entity and event, saves it for the event and selects it', async () => {
            const state = await getState();
            state.addEventQuery.mockImplementation((config) => {
                state.eventQueryConfigs.value = [...state.eventQueryConfigs.value, config];
                return Promise.resolve(config);
            });
            const router = await buildRouter(BIRTH_DIAGRAM_PATH);
            const wrapper = await mountOverview(router);

            await wrapper.get('[data-test="diagram-add"]').trigger('click');
            await settle();
            expect(findLabelInput().value).toBe(t(OVERVIEW_TEXT, 'newEventQuery.name.text', { entity: 'Person', event: 'Birth' }));

            findButton(t(OVERVIEW_TEXT, 'newEventQuery.save.label')).click();
            await settle();

            const savedConfig = state.addEventQuery.mock.lastCall?.[0];
            expect(savedConfig?.contextEventReference).toStrictEqual(BIRTH_REFERENCE);
            expect(router.currentRoute.value.path).toBe(`${BIRTH_DIAGRAM_PATH}/${savedConfig?.id ?? ''}`);
            wrapper.unmount();
        });

        it('offers a new event query from an event’s detail', async () => {
            const wrapper = await mountOverview(await buildRouter(BIRTH_DIAGRAM_PATH));

            findButton(t(OVERVIEW_TEXT, 'detail.add.label')).click();
            await settle();

            expect(findLabelInput().value).toBe(t(OVERVIEW_TEXT, 'newEventQuery.name.text', { entity: 'Person', event: 'Birth' }));
            wrapper.unmount();
        });

        it('reports a failed save', async () => {
            const state = await getState();
            state.addEventQuery.mockRejectedValue(new Error('Store unavailable.'));
            const wrapper = await mountOverview(await buildRouter(BIRTH_DIAGRAM_PATH));

            await wrapper.get('[data-test="diagram-add"]').trigger('click');
            await settle();
            findButton(t(OVERVIEW_TEXT, 'newEventQuery.save.label')).click();
            await settle();

            expect(raiseAppFailure).toHaveBeenCalledOnce();
            wrapper.unmount();
        });
    });

    describe('deleting', () => {
        it('deletes nothing when the user cancels', async () => {
            const state = await getState();
            const router = await buildRouter();
            const wrapper = await mountOverview(router);

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
            const wrapper = await mountOverview(router);

            await wrapper.get('[data-test="delete"]').trigger('click');
            await settle();
            findDialogButton(t(OVERVIEW_TEXT, 'delete.confirm.label')).click();
            await settle();

            expect(state.deleteEventQuery).toHaveBeenCalledWith('a');
            expect(router.currentRoute.value.params.eventQueryId).toBeUndefined();
            expect(document.activeElement?.textContent).toBe(t(OVERVIEW_TEXT, 'delete.done.text', { name: 'Hires' }));
            wrapper.unmount();
        });

        it('reports a failed delete and keeps the event query selected', async () => {
            const state = await getState();
            state.deleteEventQuery.mockRejectedValue(new Error('Store unavailable.'));
            const router = await buildRouter();
            const wrapper = await mountOverview(router);

            await wrapper.get('[data-test="delete"]').trigger('click');
            await settle();
            findDialogButton(t(OVERVIEW_TEXT, 'delete.confirm.label')).click();
            await settle();

            expect(raiseAppFailure).toHaveBeenCalledOnce();
            expect(router.currentRoute.value.params.eventQueryId).toBe('a');
            wrapper.unmount();
        });

        it('shows the Delete button as busy while a delete is under way', async () => {
            const state = await getState();
            const wrapper = await mountOverview(await buildRouter());

            state.deleteIsPending.value = true;
            await settle();

            expect(wrapper.get('[data-test="delete"]').attributes('disabled')).toBeDefined();
            wrapper.unmount();
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A view stands in as a button that selects the event query 'b' and a button that asks for a new one. The list hands
// over the event query, as a card does, and the diagram its id, as a node does. The diagram's add asks for the Birth
// event, as its add node does.
function constructViewStub(viewId: 'diagram' | 'list'): object {
    return {
        emits: ['add', 'select'],
        setup(_properties: object, { emit }: SetupContext<['add', 'select']>) {
            return (): ReturnType<typeof h> =>
                h('div', [
                    h('button', {
                        'data-test': viewId,
                        onClick: () => {
                            emit('select', viewId === 'list' ? { id: 'b' } : 'b');
                        }
                    }),
                    h('button', {
                        'data-test': `${viewId}-add`,
                        onClick: () => {
                            if (viewId === 'list') emit('add');
                            else emit('add', BIRTH_REFERENCE);
                        }
                    })
                ]);
        }
    };
}

// Every event query here is for the Birth event.
function buildEventQuery(id: string, label: string): EventQueryConfig {
    return { id, label: { en: label }, description: {}, icon: null, iconDark: null, typeId: 'eventQuery', contextEventReference: BIRTH_REFERENCE } as EventQueryConfig;
}

async function getState(): Promise<StateForTest> {
    const module_ = (await import('@/features/studio/eventQueries/_eventQueries')) as unknown as { stateForTest: StateForTest };
    return module_.stateForTest;
}

// The overview is mounted by itself, so its 'RouterView' shows the diagram or list route at the top level. The event
// query 'a' starts selected in the list.
async function buildRouter(path = '/eventQueries/list/a'): Promise<Router> {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { name: 'eventQueryDiagram', path: '/eventQueries/diagram/:areaId?/:modelId?/:entityId?/:eventId?/:eventQueryId?', component: EventQueryDiagramStub },
            { name: 'eventQueryList', path: '/eventQueries/list/:eventQueryId?', component: EventQueryListStub }
        ]
    });
    await router.push(path);
    await router.isReady();
    return router;
}

async function mountOverview(router: Router): Promise<VueWrapper> {
    const overviewModule = await import('@/features/studio/eventQueries/EventQueriesOverview.vue');
    const wrapper = mount(overviewModule.default, {
        attachTo: document.body, // Focus only moves between elements in the document.
        global: {
            plugins: [router],
            stubs: {
                ContextPartDetail: ContextPartDetailStub,
                EventQueryPanel: EventQueryPanelStub,
                MasterDetailPanel: MasterDetailPanelStub,
                StudioDescriptorsPanel: StudioDescriptorsPanelStub,
                Transition: false
            }
        }
    });
    await settle();
    return wrapper;
}

function findLabelInput(): HTMLInputElement {
    const input = document.querySelector<HTMLInputElement>('[data-test="label"]');
    if (!input) throw new Error('The new event query dialog is not open.');
    return input;
}

function findButton(label: string): HTMLButtonElement {
    const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find((candidate) => candidate.textContent.trim() === label);
    if (!button) throw new Error(`The page has no '${label}' button.`);
    return button;
}

function findDialogButton(label: string): HTMLButtonElement {
    const button = [...document.querySelectorAll<HTMLButtonElement>('[data-region="ConfirmDialog"] button')].find((candidate) => candidate.textContent.trim() === label);
    if (!button) throw new Error(`The confirm dialog has no '${label}' button.`);
    return button;
}
