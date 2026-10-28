// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

// ── Local Framework
import InvestigateDataPanel from '@/features/studio/dataViews/exploreData/InvestigateDataPanel.vue';
import { settle } from '~/tests/support/settle';
import { t } from '@/state/locale';
import { TEXT } from '@/features/studio/dataViews/exploreData/InvestigateDataPanel_.json';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The panel reads the data view the route names. The spec sets that data view directly.
const dataView = vi.hoisted((): { config: unknown } => ({ config: undefined }));
vi.mock('@/features/studio/dataViews/_dataViews', async (importOriginal) => {
    const { computed } = await import('vue');
    return {
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
        ...(await importOriginal<typeof import('@/features/studio/dataViews/_dataViews')>()),
        useDataView: (): { data: unknown } => ({ data: computed(() => dataView.config) })
    };
});
vi.mock('vue-router', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('vue-router')>()),
    useRoute: (): { params: { dataViewId: string } } => ({ params: { dataViewId: 'dataView1' } })
}));

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

afterEach(() => {
    dataView.config = undefined;
});

describe('InvestigateDataPanel', () => {
    it('asks for an audit when the data view has none', async () => {
        dataView.config = { contentAuditConfig: undefined, id: 'dataView1' };
        const wrapper = mount(InvestigateDataPanel);
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'audit.required.text'));
    });

    it('shows a holding message once the data view is audited', async () => {
        dataView.config = { contentAuditConfig: { asAt: 1, columns: [] }, id: 'dataView1' };
        const wrapper = mount(InvestigateDataPanel);
        await settle();

        expect(wrapper.text()).toContain(t(TEXT, 'records.pending.text'));
    });
});
