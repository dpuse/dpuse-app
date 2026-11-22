// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { contextConfig } from '@/state/configs';
import ContextSearch from '@/features/studio/eventQueries/ContextSearch.vue';
import type { ContextSearchEntry } from '@/features/studio/eventQueries/_contextDiagram';
import { establishContextModelConfig } from '@/state/contextModels';
import { localeId } from '@/state/locale';
import { raiseAppFailure } from '@/state/errors';
import { settle } from '~/tests/support/settle';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

vi.mock('@/state/errors', async (importOriginal) => ({ ...(await importOriginal<object>()), raiseAppFailure: vi.fn() }));

// A model loads through the query client, with a delay that stands in for the network, so each test gives its own.
vi.mock('@/state/contextModels', async (importOriginal) => ({ ...(await importOriginal<object>()), establishContextModelConfig: vi.fn() }));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// 'general' is listed by both areas, as a shared model could be, so it must be loaded only once.
const CONTEXT_CONFIG = {
    id: 'context',
    label: { en: 'Context' },
    description: {},
    areas: [
        { id: 'fdn', label: { en: 'Foundation' }, description: {}, models: [{ id: 'general', label: { en: 'General' }, description: {} }] },
        {
            id: 'hr',
            label: { en: 'Human Resource', es: 'Recursos humanos' },
            description: {},
            models: [
                { id: 'workforce', label: { en: 'Workforce', es: 'Plantilla' }, description: {} },
                { id: 'general', label: { en: 'General' }, description: {} }
            ]
        }
    ]
} as unknown as ContextConfig;

const WORKFORCE_MODEL_CONFIG = {
    entities: [{ id: 'person', label: { en: 'Person', es: 'Persona' }, events: [{ id: 'activation', labelAction: { en: 'Birth', es: 'Nacimiento' } }] }]
} as unknown as ContextModelConfig;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('context search', () => {
    beforeEach(() => {
        vi.mocked(establishContextModelConfig).mockImplementation((modelId) => Promise.resolve(modelId === 'workforce' ? WORKFORCE_MODEL_CONFIG : null));
        contextConfig.value = CONTEXT_CONFIG;
        localeId.value = 'en';
    });

    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        contextConfig.value = undefined;
        localeId.value = 'en';
        vi.clearAllMocks();
    });

    it('finds areas and models straight away, without loading any model', () => {
        const wrapper = mountSearch();

        expect(readOptionLabels(wrapper)).toStrictEqual([
            'Foundation (area)',
            'General (model in Foundation)',
            'Human Resource (area)',
            'Workforce (model in Human Resource)',
            'General (model in Human Resource)'
        ]);
        expect(establishContextModelConfig).not.toHaveBeenCalled();
    });

    it('loads each model once when the search is first used, then finds their entities and events', async () => {
        const wrapper = mountSearch();

        await wrapper.get('input').trigger('focusin');
        await wrapper.get('input').trigger('focusin');
        await settle();

        expect(vi.mocked(establishContextModelConfig).mock.calls.map(([modelId]) => modelId)).toStrictEqual(['general', 'workforce']);
        expect(readOptionLabels(wrapper)).toContain('Person (entity in Workforce)');
        expect(readOptionLabels(wrapper)).toContain('Birth (event of Person)');
    });

    it('words the options in the user’s language', async () => {
        localeId.value = 'es';
        const wrapper = mountSearch();

        await wrapper.get('input').trigger('focusin');
        await settle();

        expect(readOptionLabels(wrapper)).toContain('Nacimiento (evento de Persona)');
    });

    it('passes on the chosen result with what it refers to', async () => {
        const wrapper = mountSearch();
        await wrapper.get('input').trigger('focusin');
        await settle();

        const options = wrapper.getComponent({ name: 'ComboboxInput' }).props('options') as (ContextSearchEntry & { label: string })[];
        wrapper.getComponent({ name: 'ComboboxInput' }).vm.$emit(
            'select',
            options.find((option) => option.typeId === 'event')
        );

        const [entry] = wrapper.emitted('select')?.[0] as [ContextSearchEntry];
        expect(entry.contextEventReference).toStrictEqual({ areaId: 'hr', modelId: 'workforce', entityId: 'person', eventId: 'activation' });
    });

    it('reports a model that cannot be loaded, and still finds everything else', async () => {
        vi.mocked(establishContextModelConfig).mockImplementation((modelId) =>
            modelId === 'general' ? Promise.reject(new Error('Offline.')) : Promise.resolve(WORKFORCE_MODEL_CONFIG)
        );
        const wrapper = mountSearch();

        await wrapper.get('input').trigger('focusin');
        await settle();

        expect(raiseAppFailure).toHaveBeenCalledOnce();
        expect(readOptionLabels(wrapper)).toContain('Birth (event of Person)');
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountSearch(): VueWrapper {
    const wrapper = mount(ContextSearch);
    wrappers.push(wrapper);
    return wrapper;
}

function readOptionLabels(wrapper: VueWrapper): string[] {
    return (wrapper.getComponent({ name: 'ComboboxInput' }).props('options') as { label: string }[]).map((option) => option.label);
}
