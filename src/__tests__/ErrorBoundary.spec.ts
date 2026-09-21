import ErrorBoundary from '@/components/ui/error/ErrorBoundary.vue';
import { hasReportedAppError } from '@/observability/errorTracking';
import { mount } from '@vue/test-utils';
import { appFailures, clearAppFailures } from '@/state/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';

vi.mock('@/observability/errorTracking', () => ({ hasReportedAppError: vi.fn(() => Promise.resolve(true)) }));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Throws for its first 'failureCount' renders only, so a retry can be seen to succeed rather than fail again.
function buildChild(message: string, failureCount = Infinity): { component: ReturnType<typeof defineComponent>; renderCount: () => number } {
    const state = { renders: 0 };
    const component = defineComponent({
        name: 'TestChild',
        setup() {
            state.renders++;
            if (state.renders <= failureCount) throw new Error(message);
        },
        template: '<div data-region="TestChild">Loaded.</div>'
    });
    return { component, renderCount: (): number => state.renders };
}

async function mountBoundary(component: ReturnType<typeof defineComponent>): Promise<{ wrapper: ReturnType<typeof mount> }> {
    const wrapper = mount(ErrorBoundary, { props: { name: 'TestRegion', resetKey: '/' }, slots: { default: component } });
    await nextTick();
    return { wrapper };
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('ErrorBoundary', () => {
    beforeEach(() => {
        clearAppFailures();
        vi.mocked(hasReportedAppError).mockClear();
    });

    it('displays and reports an error thrown by its slot, in place of the slot', async () => {
        const { component } = buildChild('Failed to render.');
        const { wrapper } = await mountBoundary(component);

        expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(true);
        expect(wrapper.find('[data-region="TestChild"]').exists()).toBe(false);
        expect(hasReportedAppError).toHaveBeenCalledOnce();
        expect(appFailures.value).toStrictEqual([]); // Contained here, so the app-level strip stays out of it.
    });

    it('remounts the slot on retry', async () => {
        const { component, renderCount } = buildChild('Failed to render.', 1);
        const { wrapper } = await mountBoundary(component);
        expect(renderCount()).toBe(1);

        await wrapper.findComponent({ name: 'ErrorNotice' }).vm.$emit('retry');
        await nextTick();
        await nextTick();

        expect(renderCount()).toBe(2);
        expect(wrapper.find('[data-region="TestChild"]').exists()).toBe(true);
        expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(false);
    });

    it('clears the error when the reset key changes, so it does not outlive the view that produced it', async () => {
        const { component } = buildChild('Failed to render.', 1);
        const { wrapper } = await mountBoundary(component);
        expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(true);

        await wrapper.setProps({ resetKey: '/elsewhere' });
        await nextTick();
        await nextTick();

        expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(false);
    });

    it('shows a stale chunk in place like any other failure, since only this region lost anything', async () => {
        const { component } = buildChild('Failed to fetch dynamically imported module: /assets/Panel-a1b2c3.js');
        const { wrapper } = await mountBoundary(component);

        expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(true);
        expect(appFailures.value).toStrictEqual([]); // The rest of the app kept working, so nothing is raised over it.
    });
});
