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
    it('starts with the columns it is told to hide hidden', async () => {
        const wrapper = mount(Table, {
            props: {
                columnDefinitions: [
                    { accessorKey: '0', header: 'Amount' },
                    { accessorKey: '1', header: 'Amount unit' }
                ],
                dataSource: { getRows: () => Promise.resolve({ rows: [] }), rowCount: 0 },
                hiddenColumnIds: ['1'],
                isColumnPickerHidden: true
            }
        });
        await nextTick();

        expect(wrapper.findAll('[role="columnheader"]').map((header) => header.text())).toEqual(['Amount']);
        wrapper.unmount();
    });

    it('puts a resized column back to its default width on a double click of its handle', async () => {
        const wrapper = mount(Table, {
            attachTo: document.body, // A resize listens on the document.
            props: {
                columnDefinitions: [{ accessorKey: '0', header: 'Name' }],
                dataSource: { getRows: () => Promise.resolve({ rows: [] }), rowCount: 0 },
                isColumnPickerHidden: true
            }
        });
        await nextTick();
        const findWidth = (): string => wrapper.get<HTMLElement>('[role="columnheader"]').element.style.width;
        const handle = wrapper.get('[role="button"].group\\/resize');
        expect(findWidth()).toBe('150px');

        await handle.trigger('mousedown', { clientX: 100 });
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200 }));
        document.dispatchEvent(new MouseEvent('mouseup', { clientX: 200 }));
        await nextTick();
        expect(findWidth()).toBe('250px');

        await handle.trigger('dblclick');

        expect(findWidth()).toBe('150px');
        wrapper.unmount();
    });

    it('fits a column to its label on a double click when it fits to the rows on screen', async () => {
        const measure = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            return { width: this.textContent.length * 10 } as DOMRect;
        });
        const wrapper = mount(Table, {
            attachTo: document.body,
            props: {
                columnDefinitions: [{ accessorKey: '0', header: 'Name' }],
                dataSource: { getRows: () => Promise.resolve({ rows: [] }), rowCount: 0 },
                isColumnFitToVisibleRows: true,
                isColumnMenuHidden: true,
                isColumnPickerHidden: true
            }
        });
        await nextTick();

        await wrapper.get('[role="button"].group\\/resize').trigger('dblclick');

        expect(wrapper.get<HTMLElement>('[role="columnheader"]').element.style.width).toBe('64px'); // Four letters and the cell's padding.
        measure.mockRestore();
        wrapper.unmount();
    });

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
