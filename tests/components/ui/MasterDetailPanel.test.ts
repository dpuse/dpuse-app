// ── External Dependencies & Registrations
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick, ref } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Local Framework
import MasterDetailPanel from '@/components/ui/MasterDetailPanel.vue';

// jsdom lays nothing out, so the panel's measured width is set by each test.
vi.mock('@vueuse/core', async (importOriginal) => ({ ...(await importOriginal<object>()), useElementSize: (): object => ({ width: bodyWidth }) }));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const NARROW_WIDTH = 400;
const WIDE_WIDTH = 1200;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const bodyWidth = ref(0);
const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('master detail panel', () => {
    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
    });

    it('shows both panes side by side when there is room', () => {
        const wrapper = mountPanel(WIDE_WIDTH, { selectedItem: { id: 'a' } });

        expect(wrapper.get('[data-test="master"]').isVisible()).toBe(true);
        expect(wrapper.get('[data-test="detail"]').isVisible()).toBe(true);
        expect(wrapper.get('[data-test="master"]').attributes('data-split')).toBe('true');
    });

    it('shows the selected item’s detail and its action, and the placeholder with nothing selected', async () => {
        const wrapper = mountPanel(WIDE_WIDTH, { selectedItem: { id: 'a' } });

        expect(wrapper.get('[data-test="detail"]').text()).toBe('a');
        expect(wrapper.find('[data-test="action"]').exists()).toBe(true);
        expect(wrapper.find('[data-test="placeholder"]').exists()).toBe(false);

        await wrapper.setProps({ selectedItem: undefined });

        expect(wrapper.find('[data-test="detail"]').exists()).toBe(false);
        expect(wrapper.find('[data-test="action"]').exists()).toBe(false);
        expect(wrapper.find('[data-test="placeholder"]').exists()).toBe(true);
    });

    it('keeps the detail as it is when the same item arrives as a new object', async () => {
        const wrapper = mountPanel(WIDE_WIDTH, { selectedItem: { id: 'a' } });
        const detailElement = wrapper.get('[data-test="detail"]').element;

        await wrapper.setProps({ selectedItem: { id: 'a' } });

        expect(wrapper.get('[data-test="detail"]').element).toBe(detailElement);
    });

    it('shows only the detail of an item already selected when there is no room for both', () => {
        const wrapper = mountPanel(NARROW_WIDTH, { selectedItem: { id: 'a' } });

        expect(wrapper.get('[data-test="master"]').isVisible()).toBe(false);
        expect(wrapper.get('[data-test="detail"]').isVisible()).toBe(true);
    });

    it('shows only the master pane on a narrow screen with nothing selected', () => {
        const wrapper = mountPanel(NARROW_WIDTH, {});

        expect(wrapper.get('[data-test="master"]').isVisible()).toBe(true);
        expect(wrapper.get('[data-test="placeholder"]').isVisible()).toBe(false);
    });

    it('shows the master pane first on a narrow screen when the detail starts closed', () => {
        const wrapper = mountPanel(NARROW_WIDTH, { selectedItem: { id: 'a' }, isDetailInitiallyClosed: true });

        expect(wrapper.get('[data-test="master"]').isVisible()).toBe(true);
        expect(wrapper.get('[data-test="detail"]').isVisible()).toBe(false);
    });

    it('shows the detail beside the master pane once a narrow panel is given room', async () => {
        const wrapper = mountPanel(NARROW_WIDTH, { selectedItem: { id: 'a' }, isDetailInitiallyClosed: true });

        bodyWidth.value = WIDE_WIDTH;
        await nextTick();

        expect(wrapper.get('[data-test="master"]').isVisible()).toBe(true);
        expect(wrapper.get('[data-test="detail"]').isVisible()).toBe(true);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountPanel(width: number, properties: { selectedItem?: { id: string }; isDetailInitiallyClosed?: boolean }): VueWrapper {
    bodyWidth.value = width;
    const wrapper = mount(MasterDetailPanel, {
        attachTo: document.body, // 'isVisible' reads the styles of an element on the page.
        props: properties,
        slots: {
            master: ({ isSplit }: { isSplit: boolean }) => h('div', { 'data-split': String(isSplit), 'data-test': 'master' }),
            detail: ({ item }: { item: { id: string } }) => h('div', { 'data-test': 'detail' }, item.id),
            'detail-action': () => h('button', { 'data-test': 'action' }),
            'no-selection': () => h('div', { 'data-test': 'placeholder' })
        }
    });
    wrappers.push(wrapper);
    return wrapper;
}
