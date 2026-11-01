// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ObjectColumnConfig, PreviewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import ColumnDetailPanel from '@/features/studio/dataViews/selectItem/ColumnDetailPanel.vue';
import { t } from '@/state/locale';
import { TEXT } from '@/features/studio/dataViews/selectItem/ColumnDetailPanel_.json';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildColumn(overrides: Partial<ObjectColumnConfig>): ObjectColumnConfig {
    return {
        dataTypeId: 'numeric',
        formats: {},
        frequentValues: {},
        inferenceCounts: {},
        invalidValues: {},
        label: { en: 'Amount' },
        leadingInferenceCounts: {},
        validValues: {},
        ...overrides
    } as ObjectColumnConfig;
}

function mountPanel(columnConfigs: ObjectColumnConfig[], properties: object = {}): VueWrapper {
    return mount(ColumnDetailPanel, {
        global: { stubs: { SelectInput: true } },
        props: {
            columnIndex: 0,
            detectedDataTypeId: 'numeric',
            previewConfig: { columnConfigs, hasHeaders: true } as unknown as PreviewConfig,
            sourceText: 'All records',
            typeOptions: [],
            typeValue: 'auto',
            ...properties
        }
    });
}

function findTabLabels(wrapper: VueWrapper): string[] {
    return wrapper.findAll('[role="tab"]').map((tab) => tab.text());
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('ColumnDetailPanel', () => {
    it('leaves out the tabs that have nothing to show', () => {
        const wrapper = mountPanel([buildColumn({})]);

        expect(findTabLabels(wrapper)).toStrictEqual([t(TEXT, 'tab.overview.label')]);
    });

    it('keeps the invalid count in view on the Samples tab', () => {
        const wrapper = mountPanel([buildColumn({ invalidValueCount: 312, invalidValues: { 'n/a': 'string' } })]);

        expect(findTabLabels(wrapper)).toContain(t(TEXT, 'tab.samples.count.label', { count: '312' }));
    });

    it('keeps the same tab open when the column changes, to compare columns', async () => {
        const columns = [buildColumn({ formats: { '9.9': 4 } }), buildColumn({ formats: { '9,9': 2 }, label: { en: 'Tax' } })];
        const wrapper = mountPanel(columns);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        await wrapper.setProps({ columnIndex: 1 });

        expect(wrapper.find('[role="tabpanel"]').text()).toContain('9,9');
        expect(wrapper.find('h2').text()).toBe('Tax');
    });

    it('falls back to Overview when the open tab has nothing for the next column', async () => {
        const wrapper = mountPanel([buildColumn({ formats: { '9.9': 4 } }), buildColumn({})]);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        await wrapper.setProps({ columnIndex: 1 });

        expect(wrapper.find('[aria-selected="true"]').text()).toBe(t(TEXT, 'tab.overview.label'));
    });

    it('moves between tabs with the arrow keys', async () => {
        const wrapper = mountPanel([buildColumn({ formats: { '9.9': 4 } })]);

        await wrapper.find('[aria-selected="true"]').trigger('keydown', { key: 'ArrowRight' });

        expect(wrapper.find('[aria-selected="true"]').text()).toBe(t(TEXT, 'tab.formats.label'));
    });

    it('shows the detected type only when it differs from the type in use', () => {
        expect(mountPanel([buildColumn({})]).text()).not.toContain('Detected');
        expect(
            mountPanel([buildColumn({ dataTypeId: 'string' })])
                .find('[role="status"]')
                .exists()
        ).toBe(true);
    });

    it('shows the first ten of a long list, then the rest when asked', async () => {
        const frequentValues = Object.fromEntries(Array.from({ length: 12 }, (_value, index) => [`value${String(index)}`, 12 - index]));
        const wrapper = mountPanel([buildColumn({ frequentValues })]);

        await wrapper.findAll('[role="tab"]')[1]?.trigger('click');
        expect(wrapper.findAll('tbody tr')).toHaveLength(10);

        await wrapper.find('[aria-expanded="false"]').trigger('click');
        expect(wrapper.findAll('tbody tr')).toHaveLength(12);
    });

    it('offers Previous and Next only when the detail fills the space', () => {
        expect(
            mountPanel([buildColumn({})])
                .find(`[aria-label="${t(TEXT, 'next.aria')}"]`)
                .exists()
        ).toBe(false);
        expect(
            mountPanel([buildColumn({})], { canStepColumns: true })
                .find(`[aria-label="${t(TEXT, 'next.aria')}"]`)
                .exists()
        ).toBe(true);
    });
});
