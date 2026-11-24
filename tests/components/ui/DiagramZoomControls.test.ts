// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

// ── Local Framework
import DiagramZoomControls from '@/components/ui/DiagramZoomControls.vue';
import { TEXT } from '@/components/ui/DiagramZoomControls_.json';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('diagram zoom controls', () => {
    it('names the group and each of its buttons for screen readers', () => {
        const wrapper = mount(DiagramZoomControls);

        expect(wrapper.get('[role="group"]').attributes('aria-label')).toBe(TEXT['controls.aria'].en);
        expect(wrapper.findAll('button').map((button) => button.attributes('aria-label'))).toStrictEqual([TEXT['zoomIn.aria'].en, TEXT['zoomOut.aria'].en, TEXT['fit.aria'].en]);
    });

    it('reports which button was pressed', async () => {
        const wrapper = mount(DiagramZoomControls);

        for (const button of wrapper.findAll('button')) await button.trigger('click');

        expect(Object.keys(wrapper.emitted())).toStrictEqual(expect.arrayContaining(['zoomIn', 'zoomOut', 'fit']));
        expect(wrapper.emitted('zoomIn')).toHaveLength(1);
        expect(wrapper.emitted('zoomOut')).toHaveLength(1);
        expect(wrapper.emitted('fit')).toHaveLength(1);
    });
});
