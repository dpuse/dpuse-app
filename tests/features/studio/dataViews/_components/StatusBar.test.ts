// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

// ── Local Framework
import StatusBar from '@/features/studio/dataViews/_components/StatusBar.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PROGRESS = { isComplete: false, isRunning: true, label: 'Amount read', percentage: 25, valueText: 'Reading 120 records · 25%' };

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('StatusBar', () => {
    it('shows what was read on the left and what is shown on the right', () => {
        const wrapper = mount(StatusBar, { slots: { default: 'Read 120 records', end: 'Showing the first 12 records' } });

        expect(wrapper.findAll('p').map((paragraph) => paragraph.text())).toEqual(['Read 120 records', 'Showing the first 12 records']);
    });

    it('has no bar when there is no share of the item to show', () => {
        const wrapper = mount(StatusBar);

        expect(wrapper.find('[aria-valuenow]').exists()).toBe(false);
    });

    it('shows a running read as a blue progress bar, named and described for screen readers', () => {
        const bar = mount(StatusBar, { props: { progress: PROGRESS } }).get('[role="progressbar"]');

        expect(bar.attributes()).toMatchObject({ 'aria-label': 'Amount read', 'aria-valuenow': '25', 'aria-valuetext': 'Reading 120 records · 25%' });
        expect(bar.get('div').attributes('style')).toContain('width: 25%');
        expect(bar.get('div').classes().join(' ')).toContain('accent');
    });

    it('shows a settled read as a meter, green when the whole item was read', () => {
        const bar = mount(StatusBar, { props: { progress: { ...PROGRESS, isComplete: true, isRunning: false, percentage: 100 } } }).get('[role="meter"]');

        expect(bar.attributes('aria-valuenow')).toBe('100');
        expect(bar.get('div').classes().join(' ')).toContain('success');
    });

    it('keeps a sliver of a large item visible, but not an empty bar', () => {
        const sliver = mount(StatusBar, { props: { progress: { ...PROGRESS, percentage: 0.001 } } }).get('[role="progressbar"] div');
        const empty = mount(StatusBar, { props: { progress: { ...PROGRESS, percentage: 0 } } }).get('[role="progressbar"] div');

        expect(sliver.classes()).toContain('min-w-0.75');
        expect(empty.classes()).not.toContain('min-w-0.75');
    });
});
