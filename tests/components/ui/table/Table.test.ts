// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';

// ── Local Framework
import Table from '@/components/ui/table/Table.vue';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The test decides when the table is seen to resize, because jsdom lays nothing out.
const resizing = vi.hoisted((): { callbacks: (() => void)[] } => ({ callbacks: [] })); // The scroll thumbs observe too.
vi.mock('@vueuse/core', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useResizeObserver: vi.fn((_element: unknown, callback: () => void) => {
        resizing.callbacks.push(callback);
    })
}));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function notifyResize(): void {
    for (const callback of resizing.callbacks) callback();
}

function setSize(element: HTMLElement, size: number): void {
    Object.defineProperties(element, { clientHeight: { configurable: true, value: size }, clientWidth: { configurable: true, value: size } });
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('Table', () => {
    it('returns to where it was left when shown again, because a browser can reset a hidden element', async () => {
        const wrapper = mount(Table, {
            props: {
                columnDefinitions: [{ accessorKey: '0', header: 'Name' }],
                dataSource: { getRows: () => Promise.resolve({ rows: [] }), rowCount: 0 },
                isColumnPickerHidden: true
            }
        });
        await nextTick(); // The scroll listeners attach once the elements exist.
        const outerScroller = wrapper.get('[class*="overflow-y-auto"]');
        const innerScroller = wrapper.get('[class*="overflow-x-auto"]');
        const outerElement = outerScroller.element as HTMLElement;
        const innerElement = innerScroller.element as HTMLElement;

        setSize(outerElement, 500);
        setSize(innerElement, 500);
        outerElement.scrollTop = 200;
        innerElement.scrollLeft = 900;
        await outerScroller.trigger('scroll');
        await innerScroller.trigger('scroll');

        setSize(outerElement, 0); // Hidden, so its scroll position no longer counts as the user's.
        setSize(innerElement, 0);
        outerElement.scrollTop = 0;
        innerElement.scrollLeft = 0;
        await innerScroller.trigger('scroll');
        await outerScroller.trigger('scroll');
        notifyResize();

        expect(innerElement.scrollLeft).toBe(0);

        setSize(outerElement, 500);
        setSize(innerElement, 500);
        notifyResize();

        expect(outerElement.scrollTop).toBe(200);
        expect(innerElement.scrollLeft).toBe(900);
    });
});
