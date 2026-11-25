// ── External Dependencies & Registrations
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick, ref } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Local Framework
import MasterDetailPanel from '@/components/ui/MasterDetailPanel.vue';
import { TEXT as SHEET_TEXT } from '@/components/ui/SheetHeader_.json';
import SheetHeader from '@/components/ui/SheetHeader.vue';
import { t } from '@/state/locale';

// jsdom lays nothing out, so the panel's measured width is set by each test.
vi.mock('@vueuse/core', async (importOriginal) => ({ ...(await importOriginal<object>()), useElementSize: (): object => ({ height: ref(BODY_HEIGHT), width: bodyWidth }) }));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const BODY_HEIGHT = 800;
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

    describe('with a summary', () => {
        it('keeps the master pane on a narrow screen, with the detail as a sheet at its summary', () => {
            const wrapper = mountPanel(NARROW_WIDTH, { selectedItem: { id: 'a' } }, true);

            expect(wrapper.get('[data-test="master"]').isVisible()).toBe(true);
            expect(findSheet(wrapper).attributes('data-position')).toBe('summary');
            expect(wrapper.get('[data-test="summary"]').text()).toBe('a');
            expect(wrapper.find('[data-test="action"]').exists()).toBe(true);
            expect(isInert(wrapper, 'detail')).toBe(true); // Out of sight, so out of reach.
        });

        it('shows the summary, not a closed detail, when the detail starts closed', () => {
            const wrapper = mountPanel(NARROW_WIDTH, { selectedItem: { id: 'a' }, isDetailInitiallyClosed: true }, true);

            expect(findSheet(wrapper).attributes('data-position')).toBe('summary');
        });

        it('keeps the sheet closed with nothing selected, and has none beside the detail', () => {
            expect(findSheet(mountPanel(NARROW_WIDTH, {}, true)).attributes('data-position')).toBe('closed');
            expect(
                mountPanel(WIDE_WIDTH, { selectedItem: { id: 'a' } }, true)
                    .find('[role="region"]')
                    .exists()
            ).toBe(false);
        });

        it('raises the sheet one height for each click on its handle, and lowers it to the summary from the top', async () => {
            const wrapper = mountPanel(NARROW_WIDTH, { selectedItem: { id: 'a' } }, true);
            const sheet = findSheet(wrapper);

            await sheet.get(`[aria-label="${t(SHEET_TEXT, 'handle.expand.aria')}"]`).trigger('click');
            expect(sheet.attributes('data-position')).toBe('half');
            expect(wrapper.find('[data-test="summary"]').exists()).toBe(false); // The detail's own title takes over.
            expect(isInert(wrapper, 'detail')).toBe(false);

            await sheet.get(`[aria-label="${t(SHEET_TEXT, 'handle.expand.aria')}"]`).trigger('click');
            expect(sheet.attributes('data-position')).toBe('full');
            expect(isInert(wrapper, 'master')).toBe(true); // Covered, so out of reach.

            await sheet.get(`[aria-label="${t(SHEET_TEXT, 'handle.collapse.aria')}"]`).trigger('click');
            expect(sheet.attributes('data-position')).toBe('summary');
        });

        it('keeps the sheet at its height when the selection changes', async () => {
            const wrapper = mountPanel(NARROW_WIDTH, { selectedItem: { id: 'a' } }, true);
            await findSheet(wrapper)
                .get(`[aria-label="${t(SHEET_TEXT, 'handle.expand.aria')}"]`)
                .trigger('click');

            await wrapper.setProps({ selectedItem: { id: 'b' } });

            expect(findSheet(wrapper).attributes('data-position')).toBe('half');
            expect(wrapper.get('[data-test="detail"]').text()).toBe('b');
        });

        it('follows a drag of its handle, then settles on the height nearest to where it is let go', async () => {
            const wrapper = mountPanel(NARROW_WIDTH, { selectedItem: { id: 'a' } }, true);
            const sheet = findSheet(wrapper);
            const header = wrapper.getComponent(SheetHeader);

            header.vm.$emit('drag', 120);
            await nextTick();
            expect((sheet.element as HTMLElement).style.height).toBe('120px'); // jsdom lays nothing out, so the drag starts from no height.

            header.vm.$emit('dragEnd', 120);
            await nextTick();
            expect(sheet.attributes('data-position')).toBe('half');

            header.vm.$emit('dragEnd', 10); // Too short to count.
            await nextTick();
            expect(sheet.attributes('data-position')).toBe('half');

            header.vm.$emit('dragEnd', -BODY_HEIGHT); // All the way down.
            await nextTick();
            expect(sheet.attributes('data-position')).toBe('closed');
        });

        it('closes the sheet from its close button and on Escape, keeping the item selected, and shows it again when asked', async () => {
            const wrapper = mountPanel(NARROW_WIDTH, { selectedItem: { id: 'a' } }, true);
            const sheet = findSheet(wrapper);
            expect(wrapper.get('[data-test="master"]').attributes('data-detail-shown')).toBe('true');

            await sheet.get(`[aria-label="${t(SHEET_TEXT, 'close.aria')}"]`).trigger('click');
            expect(sheet.attributes('data-position')).toBe('closed');
            expect(wrapper.get('[data-test="master"]').attributes('data-detail-shown')).toBe('false');

            await wrapper.get('[data-test="master"]').trigger('click'); // The stand-in asks for the detail when clicked.
            expect(sheet.attributes('data-position')).toBe('summary');

            await wrapper.get('[data-test="master"]').trigger('keydown', { key: 'Escape' });
            expect(sheet.attributes('data-position')).toBe('closed');
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountPanel(width: number, properties: { selectedItem?: { id: string }; isDetailInitiallyClosed?: boolean }, hasSummary = false): VueWrapper {
    bodyWidth.value = width;
    const wrapper = mount(MasterDetailPanel, {
        attachTo: document.body, // 'isVisible' reads the styles of an element on the page.
        props: properties,
        slots: {
            master: ({ detailIsShown, isSplit, openDetail }: { detailIsShown: boolean; isSplit: boolean; openDetail: () => void }) =>
                h('div', { 'data-detail-shown': String(detailIsShown), 'data-split': String(isSplit), 'data-test': 'master', onClick: openDetail, tabindex: 0 }),
            detail: ({ item, close }: { item: { id: string }; close: () => void }) =>
                h('div', { 'data-test': 'detail' }, [item.id, h('button', { 'data-test': 'close', onClick: close })]),
            ...(hasSummary && { 'detail-summary': ({ item }: { item: { id: string } }): ReturnType<typeof h> => h('div', { 'data-test': 'summary' }, item.id) }),
            'detail-action': () => h('button', { 'data-test': 'action' }),
            'no-selection': () => h('div', { 'data-test': 'placeholder' })
        }
    });
    wrappers.push(wrapper);
    return wrapper;
}

function findSheet(wrapper: VueWrapper): ReturnType<VueWrapper['get']> {
    return wrapper.get('[role="region"]');
}

// jsdom has no 'inert' property, so Vue writes it as an attribute, whose value says whether it is on.
function isInert(wrapper: VueWrapper, name: string): boolean {
    return wrapper.get(`[data-test="${name}"]`).element.closest('[inert="true"]') != null;
}
