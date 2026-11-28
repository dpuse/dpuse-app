// ── External Dependencies & Registrations
import type { Ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig, EventQueryConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { contextConfig } from '@/state/configs';
import EventQueryPanel from '@/features/studio/eventQueries/EventQueryPanel.vue';
import { settle } from '~/tests/support/settle';
import { TEXT } from '@/features/studio/eventQueries/EventQueryPanel_.json';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// The panel reads the stored event query and saves edits through these hooks, neither of which these tests exercise.
vi.mock('@/features/studio/eventQueries/_eventQueries', () => ({
    useEventQuery: (): object => ({ data: { value: undefined } }),
    useUpdateEventQuery: (): object => ({ mutateAsync: vi.fn() })
}));

// The model loads through the query client, so each test sets what has arrived.
vi.mock('@/state/contextModels', async (importOriginal) => {
    const { ref } = await import('vue');
    const state = { contextModelConfig: ref<ContextModelConfig | null>(), contextModelIsPending: ref(false) };
    return {
        ...(await importOriginal<object>()),
        useContextModel: (): object => ({ data: state.contextModelConfig, isPending: state.contextModelIsPending }),
        stateForTest: state
    };
});

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface StateForTest {
    contextModelConfig: Ref<ContextModelConfig | null | undefined>;
    contextModelIsPending: Ref<boolean>;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONTEXT_CONFIG = {
    id: 'context',
    label: { en: 'Context' },
    description: {},
    areas: [{ id: 'fdn', label: { en: 'Foundation' }, description: {}, models: [{ id: 'party', label: { en: 'Party' }, description: {} }] }]
} as unknown as ContextConfig;

const PARTY_MODEL_CONFIG = {
    entities: [{ id: 'person', label: { en: 'Person' }, events: [{ id: 'activation', labelAction: 'Birth' }] }]
} as unknown as ContextModelConfig;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('event query panel context event', () => {
    beforeEach(async () => {
        const state = await getState();
        state.contextModelConfig.value = PARTY_MODEL_CONFIG;
        state.contextModelIsPending.value = false;
        contextConfig.value = CONTEXT_CONFIG;
    });

    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        contextConfig.value = undefined;
    });

    it('names the area, model, entity and event the event query is for', async () => {
        const wrapper = await mountPanel({ areaId: 'fdn', modelId: 'party', entityId: 'person', eventId: 'activation' });

        expect(readFacts(wrapper)).toStrictEqual(['Foundation', 'Party', 'Person', 'Birth']);
    });

    it('lists every fact, showing as unknown each one the context no longer has', async () => {
        const wrapper = await mountPanel({ areaId: 'fdn', modelId: 'party', entityId: 'person', eventId: 'gone' });

        expect(readFacts(wrapper)).toStrictEqual(['Foundation', 'Party', 'Person', TEXT['event.unknown.text'].en]);
    });

    it('shows the entity and event as loading until the model arrives', async () => {
        const state = await getState();
        state.contextModelConfig.value = undefined;
        state.contextModelIsPending.value = true;
        const wrapper = await mountPanel({ areaId: 'fdn', modelId: 'party', entityId: 'person', eventId: 'activation' });

        expect(readFacts(wrapper)).toStrictEqual(['Foundation', 'Party', TEXT['event.pending.text'].en, TEXT['event.pending.text'].en]);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function getState(): Promise<StateForTest> {
    const module_ = (await import('@/state/contextModels')) as unknown as { stateForTest: StateForTest };
    return module_.stateForTest;
}

async function mountPanel(contextEventReference: EventQueryConfig['contextEventReference']): Promise<VueWrapper> {
    const eventQueryLocalisedConfig = { id: 'a', label: 'Births', description: '', typeId: 'eventQuery', contextEventReference } as LocalisedConfig<EventQueryConfig>;
    const wrapper = mount(EventQueryPanel, { props: { eventQueryLocalisedConfig }, global: { stubs: { ScrollEndButtons: true } } });
    wrappers.push(wrapper);
    await settle();
    return wrapper;
}

function readFacts(wrapper: VueWrapper): string[] {
    return wrapper.findAll('dd').map((fact) => fact.text());
}
