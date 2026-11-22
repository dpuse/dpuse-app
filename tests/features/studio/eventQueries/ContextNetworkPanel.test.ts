// ── External Dependencies & Registrations
import type { Ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { defineComponent, h, type SetupContext } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig, EventQueryConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import ContextNetworkPanel from '@/features/studio/eventQueries/ContextNetworkPanel.vue';
import type { ContextSearchEntry } from '@/features/studio/eventQueries/_contextDiagram';
import { localeId } from '@/state/locale';
import { raiseAppFailure } from '@/state/errors';
import { settle } from '~/tests/support/settle';
import { TEXT } from '@/features/studio/eventQueries/ContextNetworkPanel_.json';
import { contextConfig, contextConfigStatus } from '@/state/configs';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

vi.mock('@/state/errors', async (importOriginal) => ({ ...(await importOriginal<object>()), raiseAppFailure: vi.fn() }));

// The focused model loads through the query client, so each test sets what has arrived.
vi.mock('@/state/contextModels', async (importOriginal) => {
    const { ref } = await import('vue');
    const state = { modelConfig: ref<ContextModelConfig | null>(), modelIsFetching: ref(false) };
    return { ...(await importOriginal<object>()), useContextModel: (): object => ({ data: state.modelConfig, isFetching: state.modelIsFetching }), stateForTest: state };
});

// The save goes through this hook, so the spec drives it directly. The new event query itself is built for real.
vi.mock('@/features/studio/eventQueries/_eventQueries', async (importOriginal) => {
    const { ref } = await import('vue');
    const addEventQuery = vi.fn<(config: EventQueryConfig) => Promise<EventQueryConfig>>();
    return { ...(await importOriginal<object>()), useUpdateEventQuery: (): object => ({ isPending: ref(false), mutateAsync: addEventQuery }), addEventQueryForTest: addEventQuery };
});

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface DrawnData {
    nodes: { id: string; label: string }[];
}

interface ModelStateForTest {
    modelConfig: Ref<ContextModelConfig | null | undefined>;
    modelIsFetching: Ref<boolean>;
}

type AddEventQuery = ReturnType<typeof vi.fn<(config: EventQueryConfig) => Promise<EventQueryConfig>>>;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONTEXT_CONFIG = {
    id: 'context',
    label: { en: 'Context', es: 'Contexto' },
    description: {},
    areas: [
        {
            id: 'hr',
            label: { en: 'Human Resource', es: 'Recursos humanos' },
            description: {},
            models: [{ id: 'workforce', label: { en: 'Workforce', es: 'Plantilla' }, description: {} }]
        }
    ]
} as unknown as ContextConfig;

const WORKFORCE_MODEL_CONFIG = {
    entities: [
        { id: 'person', label: { en: 'Person' }, events: [{ id: 'activation', labelAction: { en: 'Birth' } }] },
        { id: 'job', label: { en: 'Job' }, events: [] }
    ]
} as unknown as ContextModelConfig;

const AREA_NODE_ID = 'context.hr';
const CONTEXT_NODE_ID = 'context';
const ENTITY_NODE_ID = 'context.hr.workforce.person';
const EVENT_NODE_ID = 'context.hr.workforce.person.activation';
const MODEL_NODE_ID = 'context.hr.workforce';
const PERSON_BIRTH_REFERENCE = { areaId: 'hr', modelId: 'workforce', entityId: 'person', eventId: 'activation' };

// The name and description fields stand in as one input for the name, which is all the dialog needs.
const StudioDescriptorsPanelStub = {
    props: { label: { type: String, default: '' } },
    emits: ['update:label'],
    setup(properties: { label?: string }, { emit }: SetupContext<['update:label']>) {
        return (): ReturnType<typeof h> =>
            h('input', {
                'data-test': 'label',
                value: properties.label,
                onInput: (event: Event) => {
                    emit('update:label', (event.target as HTMLInputElement).value);
                }
            });
    }
};

// The search has its own tests, so it stands in as nothing, and a test emits the result it would.
const ContextSearchStub = defineComponent({ emits: ['select'], render: (): null => null });

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const diagramView = { destroy: vi.fn(), resize: vi.fn(), triggerAutoLayout: vi.fn(), update: vi.fn() }; // A diagram that can change in place, as the d3 tool's can.
const renderContextDiagram = vi.fn(); // Stands in for a tool's renderer, and records what the panel asks it to draw.
const wrappers: VueWrapper[] = []; // Unmounted after each test, so no panel from one test redraws in the next.

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('context network panel', () => {
    beforeEach(async () => {
        const modelState = await getModelState();
        modelState.modelConfig.value = WORKFORCE_MODEL_CONFIG;
        modelState.modelIsFetching.value = false;
        renderContextDiagram.mockResolvedValue(diagramView);
        contextConfig.value = CONTEXT_CONFIG;
        contextConfigStatus.value = { typeId: 'ready' };
        localeId.value = 'en';
        document.body.replaceChildren();
    });

    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        contextConfig.value = undefined;
        contextConfigStatus.value = { typeId: 'pending' };
        localeId.value = 'en';
        vi.clearAllMocks();
    });

    describe('drawing', () => {
        it('draws the context with its areas only', async () => {
            await mountPanel();

            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource']);
        });

        it('draws nothing until the context has loaded', async () => {
            contextConfig.value = undefined;
            contextConfigStatus.value = { typeId: 'pending' };
            await mountPanel();

            expect(renderContextDiagram).not.toHaveBeenCalled();

            contextConfig.value = CONTEXT_CONFIG;
            contextConfigStatus.value = { typeId: 'ready' };
            await settle();

            expect(renderContextDiagram).toHaveBeenCalledOnce();
        });

        it('offers Auto-layout only for a diagram that can lay itself out again', async () => {
            const { wrapper } = await mountPanel();

            findButton(TEXT['autoLayout.label'].en).click();
            expect(diagramView.triggerAutoLayout).toHaveBeenCalledOnce();

            renderContextDiagram.mockResolvedValue({ destroy: vi.fn(), resize: vi.fn() });
            localeId.value = 'es';
            await settle();

            expect(wrapper.findAll('button').some((button) => button.text() === TEXT['autoLayout.label'].es)).toBe(false);
        });

        it('replaces the diagram with one in the new language when the language changes', async () => {
            await mountPanel();

            localeId.value = 'es';
            await settle();

            expect(diagramView.destroy).toHaveBeenCalledOnce();
            expect(renderContextDiagram).toHaveBeenCalledTimes(2);
            expect(shownLabels()).toStrictEqual(['Contexto', 'Recursos humanos']);
        });

        it('shows the failure when the diagram cannot be drawn, and draws it on retry', async () => {
            renderContextDiagram.mockRejectedValueOnce(new Error('Chunk failed.'));
            const { wrapper } = await mountPanel();

            expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(true);

            wrapper.getComponent({ name: 'ErrorNotice' }).vm.$emit('retry');
            await settle();

            expect(renderContextDiagram).toHaveBeenCalledTimes(2);
            expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(false);
        });

        it('removes the diagram when the panel is left', async () => {
            const { wrapper } = await mountPanel();

            wrapper.unmount();

            expect(diagramView.destroy).toHaveBeenCalledOnce();
        });
    });

    describe('drilling down and up', () => {
        it('opens an area in place when it is clicked, keeping the context and showing the area’s models', async () => {
            const { router } = await mountPanel();

            await clickNode(AREA_NODE_ID);

            expect(router.currentRoute.value.params).toStrictEqual({ areaId: 'hr' });
            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce']);
            expect(diagramView.update).toHaveBeenCalledOnce();
            expect(renderContextDiagram).toHaveBeenCalledOnce();
        });

        it('opens a model in place when it is clicked, showing its entities without their events', async () => {
            const { router } = await mountPanel('/eventQueries/hr');

            await clickNode(MODEL_NODE_ID);

            expect(router.currentRoute.value.params).toMatchObject({ areaId: 'hr', modelId: 'workforce' });
            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person', 'Job']);
            expect(renderContextDiagram).toHaveBeenCalledOnce();
        });

        it('opens an entity in place when it is clicked, hiding the other entities and showing its events', async () => {
            const { router } = await mountPanel('/eventQueries/hr/workforce');

            await clickNode(ENTITY_NODE_ID);

            expect(router.currentRoute.value.params).toStrictEqual({ areaId: 'hr', modelId: 'workforce', entityId: 'person' });
            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person', 'Birth']);
            expect(renderContextDiagram).toHaveBeenCalledOnce();
        });

        it('goes back up one level when the node of the open level is clicked', async () => {
            const { router } = await mountPanel('/eventQueries/hr/workforce/person');

            await clickNode(ENTITY_NODE_ID);
            expect(router.currentRoute.value.params).toStrictEqual({ areaId: 'hr', modelId: 'workforce' });

            await clickNode(MODEL_NODE_ID);
            expect(router.currentRoute.value.params).toStrictEqual({ areaId: 'hr' });

            await clickNode(AREA_NODE_ID);
            expect(router.currentRoute.value.params).toStrictEqual({});
            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource']);
        });

        it('goes back up to a node above the open level when it is clicked', async () => {
            const { router } = await mountPanel('/eventQueries/hr/workforce/person');

            await clickNode(MODEL_NODE_ID);
            expect(router.currentRoute.value.params).toStrictEqual({ areaId: 'hr', modelId: 'workforce' });

            await clickNode(AREA_NODE_ID);
            expect(router.currentRoute.value.params).toStrictEqual({ areaId: 'hr' });

            await router.push('/eventQueries/hr/workforce/person');
            await settle();
            await clickNode(CONTEXT_NODE_ID);
            expect(router.currentRoute.value.params).toStrictEqual({});
        });

        it('does nothing when the context is clicked at the top', async () => {
            await mountPanel();
            diagramView.update.mockClear();

            await clickNode(CONTEXT_NODE_ID);

            expect(diagramView.update).not.toHaveBeenCalled();
        });

        it('opens at the level the URL names', async () => {
            await mountPanel('/eventQueries/hr/workforce/person');

            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person', 'Birth']);
        });

        it('keeps the level above on screen while a model’s data loads, then shows the model’s entities', async () => {
            const modelState = await getModelState();
            modelState.modelConfig.value = undefined;
            modelState.modelIsFetching.value = true;
            const { router } = await mountPanel('/eventQueries/hr');

            await router.push('/eventQueries/hr/workforce');
            await settle();

            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce']);
            expect(diagramView.update).not.toHaveBeenCalled();

            modelState.modelConfig.value = WORKFORCE_MODEL_CONFIG;
            modelState.modelIsFetching.value = false;
            await settle();

            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person', 'Job']);
        });

        it('draws the level from nothing with a diagram that cannot change in place', async () => {
            renderContextDiagram.mockResolvedValue({ destroy: vi.fn(), resize: vi.fn() });
            await mountPanel();

            await clickNode(AREA_NODE_ID);

            expect(renderContextDiagram).toHaveBeenCalledTimes(2);
            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce']);
        });

        it('says so when the model has no entities', async () => {
            const modelState = await getModelState();
            modelState.modelConfig.value = null;
            const { wrapper } = await mountPanel('/eventQueries/hr/workforce');

            expect(wrapper.get('[role="status"]').text()).toBe('Workforce has no entities yet.');
            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce']);
        });

        it('says so when the entity has no events', async () => {
            const { wrapper } = await mountPanel('/eventQueries/hr/workforce/job');

            expect(wrapper.get('[role="status"]').text()).toBe('Job has no events yet.');
            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Job']);
        });

        it('shows the level above for an area, model or entity the context does not have', async () => {
            await mountPanel('/eventQueries/gone');

            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource']);
        });

        it('lists the levels above as links back up, and the current level as text', async () => {
            const { router, wrapper } = await mountPanel('/eventQueries/hr/workforce/person');

            const trail = wrapper.get('[data-region="Breadcrumbs"]');
            expect(trail.findAll('a').map((link) => link.text())).toStrictEqual(['Context', 'Human Resource', 'Workforce']);
            expect(trail.text()).toContain('Person');

            await trail.findAll('a')[1]?.trigger('click');
            await settle();

            expect(router.currentRoute.value.params).toStrictEqual({ areaId: 'hr' });
            expect(shownLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce']);
        });
    });

    describe('searching', () => {
        it('opens the entity a result names', async () => {
            const { router, wrapper } = await mountPanel();

            selectSearchEntry(wrapper, {
                id: 'hr.workforce.person',
                typeId: 'entity',
                areaId: 'hr',
                areaLabel: 'Human Resource',
                modelId: 'workforce',
                modelLabel: 'Workforce',
                entityId: 'person'
            });
            await settle();

            expect(router.currentRoute.value.params).toStrictEqual({ areaId: 'hr', modelId: 'workforce', entityId: 'person' });
            expect(document.querySelector('dialog[open]')).toBeNull();
        });

        it('opens an event’s entity and starts its event query', async () => {
            const { router, wrapper } = await mountPanel();

            selectSearchEntry(wrapper, {
                id: 'hr.workforce.person.activation',
                typeId: 'event',
                areaId: 'hr',
                areaLabel: 'Human Resource',
                modelId: 'workforce',
                modelLabel: 'Workforce',
                entityId: 'person',
                entityLabel: 'Person',
                eventLabel: 'Birth',
                contextEventReference: PERSON_BIRTH_REFERENCE
            });
            await settle();

            expect(router.currentRoute.value.params).toStrictEqual({ areaId: 'hr', modelId: 'workforce', entityId: 'person' });
            expect(document.querySelector('dialog[open]')).not.toBeNull();
            expect(findLabelInput().value).toBe('Person: Birth');
        });
    });

    describe('adding an event query', () => {
        it('offers a name made from the entity and event, saves the event query for that event and opens it in the list', async () => {
            const addEventQuery = await getAddEventQuery();
            addEventQuery.mockImplementation((config) => Promise.resolve(config));
            const { router } = await mountPanel('/eventQueries/hr/workforce/person');

            await clickNode(EVENT_NODE_ID);

            expect(document.querySelector('dialog[open]')).not.toBeNull();
            expect(findLabelInput().value).toBe('Person: Birth');

            findLabelInput().value = 'Births';
            findLabelInput().dispatchEvent(new Event('input'));
            await settle();
            findButton(TEXT['newEventQuery.save.label'].en).click();
            await settle();

            const saved = addEventQuery.mock.lastCall?.[0];
            expect(saved?.label.en).toBe('Births');
            expect(saved?.contextEventReference).toStrictEqual(PERSON_BIRTH_REFERENCE);
            expect(router.currentRoute.value.name).toBe('eventQueryList');
            expect(router.currentRoute.value.params.eventQueryId).toBe(saved?.id);
        });

        it('reports a failed save and stays on the diagram', async () => {
            const addEventQuery = await getAddEventQuery();
            addEventQuery.mockRejectedValue(new Error('Store unavailable.'));
            const { router } = await mountPanel('/eventQueries/hr/workforce/person');
            await clickNode(EVENT_NODE_ID);

            findButton(TEXT['newEventQuery.save.label'].en).click();
            await settle();

            expect(raiseAppFailure).toHaveBeenCalledOnce();
            expect(router.currentRoute.value.name).toBe('eventQueries');
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function mountPanel(path = '/eventQueries'): Promise<{ router: Router; wrapper: VueWrapper }> {
    const component = { render: (): null => null };
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { name: 'eventQueryList', path: '/eventQueries/list/:eventQueryId?', component },
            { name: 'eventQueries', path: '/eventQueries/:areaId?/:modelId?/:entityId?', component }
        ]
    });
    await router.push(path);
    await router.isReady();
    const wrapper = mount(ContextNetworkPanel, {
        attachTo: document.body,
        props: { hint: 'Select an area.', renderContextDiagram },
        global: { plugins: [router], stubs: { ContextSearch: ContextSearchStub, StudioDescriptorsPanel: StudioDescriptorsPanelStub } }
    });
    wrappers.push(wrapper);
    await settle();
    return { router, wrapper };
}

// What the diagram shows now: what it was last changed to in place, or else what it was last drawn with. A draw
// from nothing starts again, so changes made to the diagram before it do not count.
function shownData(): DrawnData {
    const lastDrawOrder = renderContextDiagram.mock.invocationCallOrder.at(-1) ?? 0;
    const lastUpdateOrder = diagramView.update.mock.invocationCallOrder.at(-1) ?? 0;
    return (lastUpdateOrder > lastDrawOrder ? diagramView.update.mock.lastCall?.[0] : renderContextDiagram.mock.lastCall?.[0]) as DrawnData;
}

function shownLabels(): string[] {
    return shownData().nodes.map((node) => node.label);
}

// Clicks a node the way the tool does, by calling the panel's 'onNodeClick' with the node as the panel gave it.
async function clickNode(nodeId: string): Promise<void> {
    const onNodeClick = renderContextDiagram.mock.lastCall?.[2] as (node: { id: string }) => void;
    const node = shownData().nodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error(`The diagram has no '${nodeId}' node.`);
    onNodeClick(node);
    await settle();
}

function selectSearchEntry(wrapper: VueWrapper, entry: ContextSearchEntry): void {
    wrapper.getComponent(ContextSearchStub).vm.$emit('select', entry);
}

async function getModelState(): Promise<ModelStateForTest> {
    const module_ = (await import('@/state/contextModels')) as unknown as { stateForTest: ModelStateForTest };
    return module_.stateForTest;
}

async function getAddEventQuery(): Promise<AddEventQuery> {
    const module_ = (await import('@/features/studio/eventQueries/_eventQueries')) as unknown as { addEventQueryForTest: AddEventQuery };
    return module_.addEventQueryForTest;
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
