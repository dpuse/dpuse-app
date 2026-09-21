import { defineAsyncPanel } from '@/utilities/index.ts';
import { hasReportedAppError } from '@/observability/errorTracking';
import { defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

vi.mock('@/observability/errorTracking', () => ({ hasReportedAppError: vi.fn(() => Promise.resolve(true)) }));

async function render(panel: ReturnType<typeof defineAsyncPanel>): Promise<ReturnType<typeof mount>> {
    const wrapper = mount(defineComponent({ render: () => h(panel) }));
    await settle();
    return wrapper;
}

function echo(text: string): string {
    return text;
}

// Stands in for a panel that publishes an imperative API, which is the only kind a template ref on a panel is for.
const ExposingPanel = defineComponent({
    setup(_properties, { expose }) {
        expose({ sendMessage: echo });
    },
    template: '<div data-region="ExposingPanel" />'
});

async function settle(): Promise<void> {
    for (let index = 0; index < 6; index++) {
        await flushPromises();
        await nextTick();
    }
}

// The failure component reaches the screen through 'defineAsyncComponent's 'errorComponent' option, which is easy to
// wire in a way that renders its template while never running its script — see the note in 'defineAsyncPanel'. These
// assert the whole path, not just that something rendered: a silent version of this shipped for a long time.
describe('defineAsyncPanel load failure', () => {
    it('fault=panel shows and reports the failure in the panel’s place', async () => {
        history.replaceState({}, '', '/?fault=panel');
        vi.mocked(hasReportedAppError).mockClear();
        const wrapper = await render(defineAsyncPanel(() => Promise.resolve(defineComponent({ template: '<div />' })), 'FaultPanel'));

        expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(true);
        expect(wrapper.text()).toContain('Failed to load the FaultPanel component.');
        expect(hasReportedAppError).toHaveBeenCalledOnce();
    });

    it('failureOwnsScreen shows an overlay’s failure as a dismissible modal rather than in its place', async () => {
        history.replaceState({}, '', '/');
        const onDismiss = vi.fn();
        const panel = defineAsyncPanel(() => Promise.resolve(defineComponent({ template: '<div />' })), 'OverlayPanel', {
            failureOwnsScreen: { onDismiss },
            simulation: { failsToLoad: true }
        });
        const wrapper = mount(defineComponent({ render: () => h(panel) }), { attachTo: document.body });
        await settle();

        expect(wrapper.find('.owns-screen').exists()).toBe(true);
        expect(wrapper.find('.notice-badge').exists()).toBe(false);
        wrapper.find('dialog').element.dispatchEvent(new Event('close'));
        expect(onDismiss).toHaveBeenCalledOnce();
        wrapper.unmount();
    });

    it('pre-existing simulation option works too', async () => {
        history.replaceState({}, '', '/');
        const wrapper = await render(defineAsyncPanel(() => Promise.resolve(defineComponent({ template: '<div />' })), 'SimPanel', { simulation: { failsToLoad: true } }));
        expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(true);
    });

    it('fault=panel:<name> fails only the panel it names, so one nested inside another can be reached', async () => {
        history.replaceState({}, '', '/?fault=panel:InnerPanel');
        const outer = await render(defineAsyncPanel(() => Promise.resolve(defineComponent({ template: '<div data-region="Outer" />' })), 'OuterPanel'));
        const inner = await render(defineAsyncPanel(() => Promise.resolve(defineComponent({ template: '<div />' })), 'InnerPanel'));

        expect(outer.find('[data-region="Outer"]').exists()).toBe(true); // Loaded, so its children get their turn.
        expect(inner.find('[data-region="ErrorNotice"]').exists()).toBe(true);
    });

    it('retries the load in place rather than reloading the document', async () => {
        history.replaceState({}, '', '/');
        const state = { attempts: 0 };
        const panel = defineAsyncPanel(() => {
            state.attempts++;
            return state.attempts === 1 ? Promise.reject(new Error('First attempt fails.')) : Promise.resolve(defineComponent({ template: '<div data-region="Loaded" />' }));
        }, 'RetryPanel');

        const wrapper = await render(panel);
        expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(true);

        await wrapper.findComponent({ name: 'ErrorNotice' }).vm.$emit('retry');
        await settle();

        // Vue drops its cached request when a load fails, so remounting the panel is a fresh attempt, not a replay.
        expect(state.attempts).toBe(2);
        expect(wrapper.find('[data-region="Loaded"]').exists()).toBe(true);
        expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(false);
    });

    it('offers both recoveries, so a misjudged classification is not a dead end', async () => {
        history.replaceState({}, '', '/?fault=panel');
        const wrapper = await render(defineAsyncPanel(() => Promise.resolve(defineComponent({ template: '<div />' })), 'BothPanel'));

        expect(wrapper.text()).toContain('Retry');
        expect(wrapper.text()).toContain('Reload');
        expect(wrapper.text()).not.toContain('Cancel'); // Only the dialog offers it, where it is the close action.
    });

    it('covers the space the panel would have occupied, rather than sitting inside it', async () => {
        history.replaceState({}, '', '/?fault=panel');
        const wrapper = await render(defineAsyncPanel(() => Promise.resolve(defineComponent({ template: '<div />' })), 'CoveringPanel'));

        // The panel never arrived, so its whole region is what failed — 'covers-region' is what says so in the layout.
        expect(wrapper.find('[data-region="ErrorNotice"]').classes()).toContain('covers-region');
    });

    it('tells the user a stale chunk needs the page reloading, which a retry cannot do', async () => {
        history.replaceState({}, '', '/?fault=panel-stale');
        const wrapper = await render(defineAsyncPanel(() => Promise.resolve(defineComponent({ template: '<div />' })), 'StalePanel'));
        expect(wrapper.text()).toContain('Reload');
        expect(wrapper.text()).toContain('outdated version');
    });
});

// The host forwards attributes by hand, and 'ref' cannot travel that way — Vue takes it off the vnode first. Left
// unforwarded it fails silently at mount and only bites when the caller reaches through the ref, which is how a panel
// shipped with an unreachable 'defineExpose'.
describe('defineAsyncPanel template refs', () => {
    it('binds a caller’s ref to the panel rather than to the host', async () => {
        history.replaceState({}, '', '/');
        // Built outside the render function: a panel created inside it is a new component type on every render, which
        // remounts forever rather than failing.
        const host = defineAsyncPanel(() => Promise.resolve(ExposingPanel), 'ExposingPanel');
        const panelReference = ref<{ sendMessage?: (text: string) => string } | null>(null);
        const wrapper = mount(defineComponent({ render: () => h(host, { ref: panelReference }) }));
        await settle();

        expect(wrapper.find('[data-region="ExposingPanel"]').exists()).toBe(true);
        expect(typeof panelReference.value?.sendMessage).toBe('function');
    });
});
