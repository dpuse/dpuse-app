// ── External Dependencies & Registrations
import type { Ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { defineComponent, type PropType } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig, EventQueryConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { ContextSearchEntry } from '@/features/studio/eventQueries/_contextDiagram';
import EventQueryDiagram from '@/features/studio/eventQueries/EventQueryDiagram.vue';
import type { EventQueryDiagramData } from '@/features/studio/eventQueries/_eventQueryDiagram';
import { settle } from '~/tests/support/settle';
import { t } from '@/state/locale';
import { TEXT } from '@/features/studio/eventQueries/EventQueryDiagram_.json';
import { contextConfig, contextConfigStatus } from '@/state/configs';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// The focused model loads through the query client, so each test sets what has arrived.
vi.mock('@/state/contextModels', async (importOriginal) => {
    const { ref } = await import('vue');
    const state = { modelConfig: ref<ContextModelConfig | null>(), modelIsFetching: ref(false) };
    return { ...(await importOriginal<object>()), useContextModel: (): object => ({ data: state.modelConfig, isFetching: state.modelIsFetching }), stateForTest: state };
});

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface ModelStateForTest {
    modelConfig: Ref<ContextModelConfig | null | undefined>;
    modelIsFetching: Ref<boolean>;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONTEXT_CONFIG = {
    id: 'context',
    label: { en: 'Context' },
    description: {},
    areas: [
        {
            id: 'hr',
            label: { en: 'Human Resource' },
            description: {},
            models: [
                { id: 'workforce', label: { en: 'Workforce' }, description: {} },
                { id: 'learning', label: { en: 'Learning' }, description: {} }
            ]
        }
    ]
} as unknown as ContextConfig;

const WORKFORCE_MODEL_CONFIG = {
    entities: [
        { id: 'person', label: { en: 'Person' }, events: [{ id: 'activation', labelAction: { en: 'Birth' } }] },
        { id: 'job', label: { en: 'Job' }, events: [] }
    ]
} as unknown as ContextModelConfig;

const BIRTH_REFERENCE = { areaId: 'hr', modelId: 'workforce', entityId: 'person', eventId: 'activation' };
const BIRTH_PATH = '/hr/workforce/person/activation'; // The Birth event's level, as the diagram's route names it.
const EVENT_QUERY_LOCALISED_CONFIGS = [{ id: 'a', label: 'Hires', contextEventReference: BIRTH_REFERENCE }] as LocalisedConfig<EventQueryConfig>[];

// The diagram has its own tests, so it stands in as nothing, and a test clicks a node by emitting what it would.
const NetworkDiagramStub = defineComponent({
    props: { data: { type: Object as PropType<EventQueryDiagramData>, default: undefined }, linkColor: { type: String, default: undefined } },
    emits: ['nodeClick'],
    render: (): null => null
});

// The search has its own tests, so it stands in as nothing, and a test emits the result it would.
const ContextSearchStub = { emits: ['select'], render: (): null => null };

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('event query diagram', () => {
    beforeEach(async () => {
        const modelState = await getModelState();
        modelState.modelConfig.value = WORKFORCE_MODEL_CONFIG;
        modelState.modelIsFetching.value = false;
        contextConfig.value = CONTEXT_CONFIG;
        contextConfigStatus.value = { typeId: 'ready' };
    });

    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        contextConfig.value = undefined;
        contextConfigStatus.value = { typeId: 'pending' };
    });

    describe('drilling down and up', () => {
        it('shows the context with its areas at the top', async () => {
            const { wrapper } = await mountDiagram();

            expect(shownLabels(wrapper)).toStrictEqual(['Context', 'Human Resource']);
        });

        it('opens an area, a model, an entity and an event in turn, keeping each level in the URL', async () => {
            const { router, wrapper } = await mountDiagram();

            await clickNode(wrapper, 'Human Resource');
            await clickNode(wrapper, 'Workforce');
            await clickNode(wrapper, 'Person');
            await clickNode(wrapper, 'Birth');

            expect(router.currentRoute.value.path).toBe(`/eventQueries/diagram${BIRTH_PATH}`);
            expect(shownLabels(wrapper)).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person', 'Birth', 'Hires', t(TEXT, 'add.label')]);
        });

        it('changes nothing when the selected node is clicked again, and goes back up from a node above it', async () => {
            const { router, wrapper } = await mountDiagram('/hr/workforce');

            const { fullPath } = router.currentRoute.value;
            await clickNode(wrapper, 'Workforce');
            expect(router.currentRoute.value.fullPath).toBe(fullPath);

            await clickNode(wrapper, 'Human Resource');
            expect(router.currentRoute.value.path).toBe('/eventQueries/diagram/hr');

            await clickNode(wrapper, 'Context');
            expect(router.currentRoute.value.path).toBe('/eventQueries/diagram');
        });

        it('shows the selected event query’s event, whatever level the URL names', async () => {
            const { wrapper } = await mountDiagram('', 'a');

            expect(shownLabels(wrapper)).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person', 'Birth', 'Hires', t(TEXT, 'add.label')]);
        });

        it('keeps the level drawn while a model’s data loads, so the model is not shown bare first', async () => {
            const modelState = await getModelState();
            const { router, wrapper } = await mountDiagram('/hr');

            modelState.modelIsFetching.value = true;
            await router.push('/eventQueries/diagram/hr/workforce');
            await settle();
            expect(shownLabels(wrapper)).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Learning']);

            modelState.modelIsFetching.value = false;
            await settle();
            expect(shownLabels(wrapper)).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person', 'Job']);
        });

        it('opens the level of a search result, down to an event', async () => {
            const { router, wrapper } = await mountDiagram();
            const entry: ContextSearchEntry = {
                id: 'x',
                typeId: 'event',
                areaId: 'hr',
                areaLabel: '',
                modelId: 'workforce',
                entityId: 'person',
                contextEventReference: BIRTH_REFERENCE
            };

            wrapper.getComponent(ContextSearchStub).vm.$emit('select', entry);
            await settle();

            expect(router.currentRoute.value.path).toBe(`/eventQueries/diagram${BIRTH_PATH}`);
        });
    });

    describe('selecting and adding', () => {
        it('marks the area, model, entity or event drilled down to as selected, and never the context node', async () => {
            const { wrapper } = await mountDiagram(BIRTH_PATH);
            expect(selectedLabels(wrapper)).toStrictEqual(['Birth']);

            await clickNode(wrapper, 'Context');
            expect(selectedLabels(wrapper)).toStrictEqual([]);
        });

        it('marks the selected event query in place of its event', async () => {
            const { wrapper } = await mountDiagram(BIRTH_PATH, 'a');

            expect(selectedLabels(wrapper)).toStrictEqual(['Hires']);
        });

        it('hands a clicked event query to its parent, and asks it for a new one for the event from the add node', async () => {
            const { wrapper } = await mountDiagram(BIRTH_PATH);

            await clickNode(wrapper, 'Hires');
            await clickNode(wrapper, t(TEXT, 'add.label'));

            expect(wrapper.emitted('select')).toStrictEqual([['a']]);
            expect(wrapper.emitted('add')).toStrictEqual([[BIRTH_REFERENCE]]);
        });

        it('clears the selected event query when another level is opened', async () => {
            const { router, wrapper } = await mountDiagram(BIRTH_PATH, 'a');

            await clickNode(wrapper, 'Person');

            expect(router.currentRoute.value.path).toBe('/eventQueries/diagram/hr/workforce/person');
        });
    });

    describe('status', () => {
        it('says when a model has no entities, or an entity no events', async () => {
            const modelState = await getModelState();
            const { router, wrapper } = await mountDiagram('/hr/workforce/job');
            expect(wrapper.get('[role="status"]').text()).toBe(t(TEXT, 'entity.empty.text', { entity: 'Job' }));

            modelState.modelConfig.value = { entities: [] } as unknown as ContextModelConfig;
            await router.push('/eventQueries/diagram/hr/workforce');
            await settle();
            expect(wrapper.get('[role="status"]').text()).toBe(t(TEXT, 'model.empty.text', { model: 'Workforce' }));
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function getModelState(): Promise<ModelStateForTest> {
    const module_ = (await import('@/state/contextModels')) as unknown as { stateForTest: ModelStateForTest };
    return module_.stateForTest;
}

async function mountDiagram(levelPath = '', selectedEventQueryId?: string): Promise<{ router: Router; wrapper: VueWrapper }> {
    const component = { render: (): null => null };
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { name: 'eventQueryDiagram', path: '/eventQueries/diagram/:areaId?/:modelId?/:entityId?/:eventId?/:eventQueryId?', component },
            { name: 'eventQueryList', path: '/eventQueries/list/:eventQueryId?', component }
        ]
    });
    await router.push(`/eventQueries/diagram${levelPath}`);
    await router.isReady();
    const wrapper = mount(EventQueryDiagram, {
        props: { eventQueryLocalisedConfigs: EVENT_QUERY_LOCALISED_CONFIGS, selectedEventQueryId },
        global: { plugins: [router], stubs: { ContextSearch: ContextSearchStub, NetworkDiagram: NetworkDiagramStub } }
    });
    wrappers.push(wrapper);
    await settle();
    return { router, wrapper };
}

function shownData(wrapper: VueWrapper): EventQueryDiagramData {
    const data = wrapper.getComponent(NetworkDiagramStub).props('data');
    if (!data) throw new Error('The diagram has been given nothing to draw.');
    return data;
}

// The context node and the add node have a name in place of a label.
function shownLabels(wrapper: VueWrapper): string[] {
    return shownData(wrapper).nodes.map((node) => node.label ?? node.title ?? '');
}

function selectedLabels(wrapper: VueWrapper): (string | undefined)[] {
    return shownData(wrapper)
        .nodes.filter((node) => node.isSelected === true)
        .map((node) => node.label);
}

async function clickNode(wrapper: VueWrapper, label: string): Promise<void> {
    const node = shownData(wrapper).nodes.find((candidate) => (candidate.label ?? candidate.title) === label);
    if (!node) throw new Error(`The diagram has no '${label}' node.`);
    wrapper.getComponent(NetworkDiagramStub).vm.$emit('nodeClick', node);
    await settle();
}
