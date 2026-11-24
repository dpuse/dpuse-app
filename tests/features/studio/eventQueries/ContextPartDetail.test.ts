// ── External Dependencies & Registrations
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ContextModelConfig, EventQueryConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import ContextPartDetail from '@/features/studio/eventQueries/ContextPartDetail.vue';
import { settle } from '~/tests/support/settle';
import { t } from '@/state/locale';
import { TEXT } from '@/features/studio/eventQueries/ContextPartDetail_.json';
import type { ContextAreaConfig, ContextEntityConfig, ContextEventConfig, ContextModelReferenceConfig } from '@/features/studio/eventQueries/_contextDiagramFocus';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface PartProperties {
    areaConfig: ContextAreaConfig;
    modelReferenceConfig?: ContextModelReferenceConfig;
    modelConfig?: ContextModelConfig | null;
    modelIsLoading?: boolean;
    entityConfig?: ContextEntityConfig;
    eventConfig?: ContextEventConfig;
    eventQueryLocalisedConfigs?: LocalisedConfig<EventQueryConfig>[];
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const MODEL_REFERENCE = { id: 'workforce', label: { en: 'Workforce' }, description: { en: 'The people who work here.' } } as unknown as ContextModelReferenceConfig;
const AREA = { id: 'hr', label: { en: 'Human Resource' }, description: { en: 'People and their work.' }, models: [MODEL_REFERENCE] } as unknown as ContextAreaConfig;
const BIRTH = { id: 'activation', labelAction: { en: 'Birth' }, description: {} } as unknown as ContextEventConfig;
const PERSON = { id: 'person', label: { en: 'Person' }, description: { en: 'Someone known to the business.' }, events: [BIRTH] } as unknown as ContextEntityConfig;
const WORKFORCE_MODEL_CONFIG = { entities: [PERSON] } as unknown as ContextModelConfig;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('context part detail', () => {
    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
    });

    it('shows an area with its description and its models, and no location', async () => {
        const wrapper = await mountDetail({ areaConfig: AREA });

        expect(wrapper.text()).toContain(t(TEXT, 'area.label'));
        expect(wrapper.find('h1, h2').text()).toBe('Human Resource');
        expect(wrapper.text()).toContain('People and their work.');
        expect(wrapper.find('dl').exists()).toBe(false);
        expect(listedItems(wrapper)).toStrictEqual(['Workforce']);
    });

    it('shows a model’s entities once its data has loaded, and says so while it loads', async () => {
        const wrapper = await mountDetail({ areaConfig: AREA, modelReferenceConfig: MODEL_REFERENCE, modelIsLoading: true });
        expect(wrapper.text()).toContain(t(TEXT, 'contents.pending.text'));

        await wrapper.setProps({ modelConfig: WORKFORCE_MODEL_CONFIG, modelIsLoading: false });
        expect(listedItems(wrapper)).toStrictEqual(['Person']);
        expect(facts(wrapper)).toStrictEqual(['Human Resource']);
    });

    it('shows where an event sits and the event queries saved for it', async () => {
        const eventQueryLocalisedConfigs = [{ id: 'a', label: 'Hires' }] as LocalisedConfig<EventQueryConfig>[];
        const wrapper = await mountDetail({ areaConfig: AREA, modelReferenceConfig: MODEL_REFERENCE, entityConfig: PERSON, eventConfig: BIRTH, eventQueryLocalisedConfigs });

        expect(wrapper.find('h1, h2').text()).toBe('Birth');
        expect(facts(wrapper)).toStrictEqual(['Human Resource', 'Workforce', 'Person']);
        expect(listedItems(wrapper)).toStrictEqual(['Hires']);
    });

    it('says when a part has no description and holds nothing yet', async () => {
        const wrapper = await mountDetail({ areaConfig: AREA, modelReferenceConfig: MODEL_REFERENCE, entityConfig: PERSON, eventConfig: BIRTH });

        expect(wrapper.text()).toContain(t(TEXT, 'description.none.text'));
        expect(wrapper.text()).toContain(t(TEXT, 'contents.none.text'));
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function mountDetail(properties: PartProperties): Promise<VueWrapper> {
    const wrapper = mount(ContextPartDetail, { props: properties, global: { stubs: { ScrollEndButtons: true } } });
    wrappers.push(wrapper);
    await settle();
    return wrapper;
}

function facts(wrapper: VueWrapper): string[] {
    return wrapper.findAll('dd').map((fact) => fact.text());
}

function listedItems(wrapper: VueWrapper): string[] {
    return wrapper.findAll('li').map((item) => item.text());
}
