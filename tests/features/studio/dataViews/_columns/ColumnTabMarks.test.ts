// ── External Dependencies & Registrations
import { type Component, h, type VNode } from 'vue';
import { describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Local Framework
import type { ColumnFacts } from '@/features/studio/dataViews/_columns/previewColumnRows';
import ColumnTabMarks from '@/features/studio/dataViews/_columns/ColumnTabMarks.vue';
import { t } from '@/state/locale';
import { TEXT } from '@/features/studio/dataViews/_columns/ColumnTabMarks_.json';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface MarksProperties {
    columnFacts: ColumnFacts;
    isIgnored?: boolean;
    isTypeChosen?: boolean;
    typeIcon: Component;
    typeText: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const UNKNOWN_FACTS: ColumnFacts = { isKey: undefined, isMandatory: undefined, isUnique: undefined };

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('ColumnTabMarks', () => {
    it('shows a key in place of the unique mark, with the mandatory mark after it', () => {
        const wrapper = mountMarks({ columnFacts: { isKey: true, isMandatory: true, isUnique: true } });

        expect(readMarkLabels(wrapper)).toEqual(new Set([t(TEXT, 'key.aria'), t(TEXT, 'mandatory.aria'), 'Integer']));
    });

    it('shows the unique mark for a column that is unique but not a key', () => {
        const wrapper = mountMarks({ columnFacts: { isKey: false, isMandatory: false, isUnique: true } });

        expect(readMarkLabels(wrapper)).toEqual(new Set([t(TEXT, 'unique.aria'), 'Integer']));
    });

    it('shows only the type, named for screen readers, while the facts are not known', () => {
        const wrapper = mountMarks({});

        expect(readMarkLabels(wrapper)).toEqual(new Set(['Integer']));
        expect(wrapper.find('.rounded-full').exists()).toBe(false);
    });

    it('marks a type the user chose with a dot', () => {
        const wrapper = mountMarks({ isTypeChosen: true });

        expect(wrapper.find('span.rounded-full').exists()).toBe(true);
    });

    it('marks a column left out of the load with a ✕ in place of the dot', () => {
        const wrapper = mountMarks({ isIgnored: true, isTypeChosen: true });

        expect(wrapper.find('svg.rounded-full').exists()).toBe(true);
        expect(wrapper.find('span.rounded-full').exists()).toBe(false);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountMarks(overrides: Partial<MarksProperties>): VueWrapper {
    const properties: MarksProperties = { columnFacts: UNKNOWN_FACTS, typeIcon: (): VNode => h('i'), typeText: 'Integer', ...overrides };
    return mount(ColumnTabMarks, { props: properties });
}

// A set, because the marks and the type icon are two roots, which the wrapper does not list in template order.
function readMarkLabels(wrapper: VueWrapper): Set<string | undefined> {
    return new Set(wrapper.findAll('[role="img"]').map((mark) => mark.attributes('aria-label')));
}
