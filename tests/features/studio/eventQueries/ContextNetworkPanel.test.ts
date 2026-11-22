// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { h, type SetupContext } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig, EventQueryConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import ContextNetworkPanel from '@/features/studio/eventQueries/ContextNetworkPanel.vue';
import { establishContextModelConfig } from '@/state/contextModels';
import { establishTool } from '@/services/tools';
import { localeId } from '@/state/locale';
import { raiseAppFailure } from '@/state/errors';
import { settle } from '~/tests/support/settle';
import { TEXT } from '@/features/studio/eventQueries/ContextNetworkPanel_.json';
import { contextConfig, contextConfigStatus } from '@/state/configs';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

vi.mock('@/state/errors', async (importOriginal) => ({ ...(await importOriginal<object>()), raiseAppFailure: vi.fn() }));

// The d3 tool is downloaded at run time, so a stand-in records what the panel asks it to draw.
vi.mock('@/services/tools', () => ({ establishTool: vi.fn() }));

// A model loads through the query client, with a delay that stands in for the network, so each test gives its own.
vi.mock('@/state/contextModels', async (importOriginal) => ({ ...(await importOriginal<object>()), establishContextModelConfig: vi.fn() }));

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
    entities: [{ id: 'person', label: { en: 'Person' }, events: [{ id: 'activation', labelAction: { en: 'Birth' } }] }]
} as unknown as ContextModelConfig;

const EVENT_NODE_ID = 'context.hr.workforce.person.activation';
const MODEL_NODE_ID = 'context.hr.workforce';

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

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const diagramView = { destroy: vi.fn(), resize: vi.fn(), triggerAutoLayout: vi.fn() };
const renderNetworkDiagram = vi.fn();
const wrappers: VueWrapper[] = []; // Unmounted after each test, so no panel from one test redraws in the next.

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('context network panel', () => {
    beforeEach(() => {
        renderNetworkDiagram.mockResolvedValue(diagramView);
        vi.mocked(establishTool).mockResolvedValue({ renderNetworkDiagram });
        vi.mocked(establishContextModelConfig).mockResolvedValue(WORKFORCE_MODEL_CONFIG);
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
        it('draws the context’s areas and models, then lays them out', async () => {
            await mountPanel();

            expect(drawnLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce']);
            expect(diagramView.triggerAutoLayout).toHaveBeenCalledOnce();
        });

        it('draws nothing until the context has loaded', async () => {
            contextConfig.value = undefined;
            contextConfigStatus.value = { typeId: 'pending' };
            await mountPanel();

            expect(renderNetworkDiagram).not.toHaveBeenCalled();

            contextConfig.value = CONTEXT_CONFIG;
            contextConfigStatus.value = { typeId: 'ready' };
            await settle();

            expect(renderNetworkDiagram).toHaveBeenCalledOnce();
        });

        it('replaces the diagram with one in the new language when the language changes', async () => {
            await mountPanel();

            localeId.value = 'es';
            await settle();

            expect(diagramView.destroy).toHaveBeenCalledOnce();
            expect(drawnLabels()).toStrictEqual(['Contexto', 'Recursos humanos', 'Plantilla']);
        });

        it('shows the failure when the tool cannot be loaded, and draws the diagram on retry', async () => {
            vi.mocked(establishTool).mockRejectedValueOnce(new Error('Chunk failed.'));
            const { wrapper } = await mountPanel();

            expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(true);
            expect(renderNetworkDiagram).not.toHaveBeenCalled();

            wrapper.getComponent({ name: 'ErrorNotice' }).vm.$emit('retry');
            await settle();

            expect(renderNetworkDiagram).toHaveBeenCalledOnce();
            expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(false);
        });

        it('removes the diagram when the panel is left', async () => {
            const { wrapper } = await mountPanel();

            wrapper.unmount();

            expect(diagramView.destroy).toHaveBeenCalledOnce();
        });
    });

    describe('opening a model', () => {
        it('draws the model’s entities and events when the model is clicked, and removes them when it is clicked again', async () => {
            await mountPanel();

            await clickNode(MODEL_NODE_ID);

            expect(establishContextModelConfig).toHaveBeenCalledWith('workforce');
            expect(drawnLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person', 'Birth']);

            await clickNode(MODEL_NODE_ID);

            expect(drawnLabels()).toStrictEqual(['Context', 'Human Resource', 'Workforce']);
        });

        it('says so when the model has no entities, and leaves the diagram as it was', async () => {
            vi.mocked(establishContextModelConfig).mockResolvedValue(null);
            const { wrapper } = await mountPanel();

            await clickNode(MODEL_NODE_ID);

            expect(wrapper.get('[role="status"]').text()).toBe('Workforce has no entities yet.');
            expect(renderNetworkDiagram).toHaveBeenCalledOnce();
        });

        it('reports a model that cannot be loaded, and leaves the diagram as it was', async () => {
            vi.mocked(establishContextModelConfig).mockRejectedValue(new Error('Offline.'));
            await mountPanel();

            await clickNode(MODEL_NODE_ID);

            expect(raiseAppFailure).toHaveBeenCalledOnce();
            expect(renderNetworkDiagram).toHaveBeenCalledOnce();
        });
    });

    describe('adding an event query', () => {
        it('offers a name made from the entity and event, saves the event query for that event and opens it in the list', async () => {
            const addEventQuery = await getAddEventQuery();
            addEventQuery.mockImplementation((config) => Promise.resolve(config));
            const { router } = await mountPanel();
            await clickNode(MODEL_NODE_ID);

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
            expect(saved?.contextEventReference).toStrictEqual({ areaId: 'hr', modelId: 'workforce', entityId: 'person', eventId: 'activation' });
            expect(router.currentRoute.value.name).toBe('eventQueryList');
            expect(router.currentRoute.value.params.eventQueryId).toBe(saved?.id);
        });

        it('reports a failed save and stays on the diagram', async () => {
            const addEventQuery = await getAddEventQuery();
            addEventQuery.mockRejectedValue(new Error('Store unavailable.'));
            const { router } = await mountPanel();
            await clickNode(MODEL_NODE_ID);
            await clickNode(EVENT_NODE_ID);

            findButton(TEXT['newEventQuery.save.label'].en).click();
            await settle();

            expect(raiseAppFailure).toHaveBeenCalledOnce();
            expect(router.currentRoute.value.name).toBe('eventQueries');
        });

        it('opens nothing for a node that is neither a model nor an event', async () => {
            await mountPanel();

            await clickNode('context.hr');

            expect(document.querySelector('dialog[open]')).toBeNull();
            expect(renderNetworkDiagram).toHaveBeenCalledOnce();
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function mountPanel(): Promise<{ router: Router; wrapper: VueWrapper }> {
    const component = { render: (): null => null };
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { name: 'eventQueries', path: '/eventQueries', component },
            { name: 'eventQueryList', path: '/eventQueries/list/:eventQueryId?', component }
        ]
    });
    await router.push('/eventQueries');
    await router.isReady();
    const wrapper = mount(ContextNetworkPanel, { attachTo: document.body, global: { plugins: [router], stubs: { StudioDescriptorsPanel: StudioDescriptorsPanelStub } } });
    wrappers.push(wrapper);
    await settle();
    return { router, wrapper };
}

function drawnLabels(): string[] {
    return (renderNetworkDiagram.mock.lastCall?.[0] as DrawnData).nodes.map((node) => node.label);
}

// Clicks a node the way the tool does, by calling the panel's 'onNodeClick' with the node as the panel gave it.
async function clickNode(nodeId: string): Promise<void> {
    const [data, , options] = renderNetworkDiagram.mock.lastCall as [DrawnData, HTMLElement, { onNodeClick: (node: { id: string }) => void }];
    const node = data.nodes.find((candidate) => candidate.id === nodeId);
    if (!node) throw new Error(`The diagram has no '${nodeId}' node.`);
    options.onNodeClick(node);
    await settle();
}

async function getAddEventQuery(): Promise<ReturnType<typeof vi.fn<(config: EventQueryConfig) => Promise<EventQueryConfig>>>> {
    const module_ = (await import('@/features/studio/eventQueries/_eventQueries')) as unknown as {
        addEventQueryForTest: ReturnType<typeof vi.fn<(config: EventQueryConfig) => Promise<EventQueryConfig>>>;
    };
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
