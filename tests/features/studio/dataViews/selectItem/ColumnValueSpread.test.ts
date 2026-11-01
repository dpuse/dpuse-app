// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import ColumnValueSpread from '@/features/studio/dataViews/selectItem/ColumnValueSpread.vue';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountSpread(frequentValues: Record<string, number> | undefined): ReturnType<typeof mount> {
    return mount(ColumnValueSpread, { props: { columnConfig: { frequentValues } as ObjectColumnConfig, columnLabel: 'Country' } });
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('ColumnValueSpread', () => {
    it('sizes each bar by its share of the highest, and names the values', () => {
        const wrapper = mountSpread({ Chad: 20, Peru: 10 });

        expect(wrapper.findAll('span span').map((bar) => (bar.element as HTMLElement).style.height)).toEqual(['100%', '50%']);
        expect(wrapper.get('[role="img"]').attributes('title')).toBe('Country, most common values: Chad (20), Peru (10)');
    });

    it('shows at most five values', () => {
        const wrapper = mountSpread({ a: 7, b: 6, c: 5, d: 4, e: 3, f: 2 });

        expect(wrapper.findAll('span span')).toHaveLength(5);
    });

    it('shows nothing with fewer than two repeated values', () => {
        expect(mountSpread({ Chad: 20 }).find('[role="img"]').exists()).toBe(false);
        expect(mountSpread(undefined).find('[role="img"]').exists()).toBe(false);
    });
});
