// ── External Dependencies & Registrations
import { defineComponent } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Local Framework
import Tooltip from '@/components/ui/Tooltip.vue';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

const TestTooltip = defineComponent({
    components: { Tooltip },
    template: `
        <Tooltip text="Range 50 to 59">
            <template #default="{ triggerAttributes }"><button v-bind="triggerAttributes" type="button">Bar</button></template>
        </Tooltip>`
});

function mountTooltip(): VueWrapper {
    const wrapper = mount(TestTooltip, { attachTo: document.body });
    wrappers.push(wrapper);
    return wrapper;
}

async function hoverTrigger(wrapper: VueWrapper, pointerType = 'mouse'): Promise<void> {
    await wrapper.find('[data-region="Tooltip"]').trigger('pointerenter', { pointerType });
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('Tooltip', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        vi.useRealTimers();
    });

    it('opens after a short delay on hover, and names itself as the trigger’s description', async () => {
        const wrapper = mountTooltip();

        await hoverTrigger(wrapper);
        expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
        await vi.advanceTimersByTimeAsync(300);

        const tooltip = wrapper.find('[role="tooltip"]');
        expect(tooltip.text()).toBe('Range 50 to 59');
        expect(wrapper.find('button').attributes('aria-describedby')).toBe(tooltip.attributes('id'));
    });

    it('opens at once on keyboard focus, and closes when focus leaves', async () => {
        const wrapper = mountTooltip();
        const button = wrapper.find('button').element as HTMLButtonElement;

        button.focus();
        await vi.advanceTimersByTimeAsync(0);
        expect(wrapper.find('[role="tooltip"]').exists()).toBe(true);

        button.blur();
        await vi.advanceTimersByTimeAsync(0);
        expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
    });

    it('opens nothing for a touch, which has no hover', async () => {
        const wrapper = mountTooltip();

        await hoverTrigger(wrapper, 'touch');
        await vi.advanceTimersByTimeAsync(300);

        expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
    });

    it('closes once the pointer leaves, and on Escape', async () => {
        const wrapper = mountTooltip();
        await hoverTrigger(wrapper);
        await vi.advanceTimersByTimeAsync(300);

        await wrapper.find('[data-region="Tooltip"]').trigger('pointerleave');
        await vi.advanceTimersByTimeAsync(100);
        expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);

        await vi.advanceTimersByTimeAsync(1000); // Past the warm period, so the next opens after the delay.
        await hoverTrigger(wrapper);
        await vi.advanceTimersByTimeAsync(300);
        dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await vi.advanceTimersByTimeAsync(0);
        expect(wrapper.find('[role="tooltip"]').exists()).toBe(false);
    });

    it('opens the next tooltip at once when moving straight on from one that just closed', async () => {
        const first = mountTooltip();
        const second = mountTooltip();
        await hoverTrigger(first);
        await vi.advanceTimersByTimeAsync(300);
        await first.find('[data-region="Tooltip"]').trigger('pointerleave');
        await vi.advanceTimersByTimeAsync(100);

        await hoverTrigger(second);
        await vi.advanceTimersByTimeAsync(0);

        expect(second.find('[role="tooltip"]').exists()).toBe(true);
    });
});
