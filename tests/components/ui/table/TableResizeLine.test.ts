// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, shallowRef } from 'vue';
import { type RowData, useTable } from '@tanstack/vue-table';

// ── Local Framework
import { tableFeatureSet } from '@/components/ui/table/tableFeatures';
import TableHeaderCell from '@/components/ui/table/TableHeaderCell.vue';
import TableResizeLine from '@/components/ui/table/TableResizeLine.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const HEADER_LEFT_PX = 30;
const HANDLE_LEFT_PX = 190; // Left of where the drag starts, because the grab area is wider than the handle.
const COLUMN_START_SIZE_PX = 150;
const DRAG_START_X_PX = 200;

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountHarness(): ReturnType<typeof mount> {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        return { left: this.matches('[data-region="TableResizeHandle"]') ? HANDLE_LEFT_PX : HEADER_LEFT_PX } as DOMRect;
    });

    return mount(
        defineComponent({
            setup() {
                const headerViewportElement = shallowRef<HTMLDivElement | null>(null);
                const table = useTable<typeof tableFeatureSet, RowData>({
                    features: tableFeatureSet,
                    data: [],
                    columns: [{ id: 'name', header: 'Name', minSize: 100, size: COLUMN_START_SIZE_PX }],
                    enableColumnResizing: true,
                    columnResizeMode: 'onEnd'
                });
                return () => [
                    h('p', { 'data-region': 'Width' }, String(table.getColumn('name')?.getSize())),
                    h('div', { ref: headerViewportElement }, [h(TableHeaderCell, { header: table.getCenterLeafHeaders()[0], isMenuHidden: true })]),
                    h(TableResizeLine, { headerViewportElement: headerViewportElement.value, table })
                ];
            }
        })
    );
}

function getLineLeft(wrapper: ReturnType<typeof mount>): string {
    return wrapper.get<HTMLElement>('[data-region="TableResizeLine"]').element.style.transform;
}

async function moveTo(clientX: number): Promise<void> {
    document.dispatchEvent(new MouseEvent('mousemove', { clientX }));
    await nextTick();
}

async function endDrag(clientX: number): Promise<void> {
    document.dispatchEvent(new MouseEvent('mouseup', { clientX }));
    await nextTick();
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('TableResizeLine', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows nothing until a drag starts', () => {
        const wrapper = mountHarness();

        expect(wrapper.find('[data-region="TableResizeLine"]').exists()).toBe(false);
    });

    it('starts on the handle, not under the cursor', async () => {
        const wrapper = mountHarness();

        await wrapper.get('[role="button"]').trigger('mousedown', { clientX: DRAG_START_X_PX });

        expect(getLineLeft(wrapper)).toBe(`translateX(${String(HANDLE_LEFT_PX - HEADER_LEFT_PX)}px)`);

        await endDrag(DRAG_START_X_PX);
    });

    it('starts on the handle where it now is when the same column is dragged again', async () => {
        const wrapper = mountHarness();

        await wrapper.get('[role="button"]').trigger('mousedown', { clientX: DRAG_START_X_PX });
        await endDrag(DRAG_START_X_PX);

        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            return { left: this.matches('[data-region="TableResizeHandle"]') ? HANDLE_LEFT_PX + 60 : HEADER_LEFT_PX } as DOMRect;
        });
        await wrapper.get('[role="button"]').trigger('mousedown', { clientX: DRAG_START_X_PX });

        expect(getLineLeft(wrapper)).toBe(`translateX(${String(HANDLE_LEFT_PX + 60 - HEADER_LEFT_PX)}px)`);

        await endDrag(DRAG_START_X_PX);
    });

    it('follows the drag while the column keeps its width, then the column takes the new width', async () => {
        vi.stubGlobal('requestAnimationFrame', undefined); // Without a frame to wait for, each move applies at once.
        const wrapper = mountHarness();

        await wrapper.get('[role="button"]').trigger('mousedown', { clientX: DRAG_START_X_PX });
        await moveTo(DRAG_START_X_PX + 40);

        expect(getLineLeft(wrapper)).toBe(`translateX(${String(HANDLE_LEFT_PX + 40 - HEADER_LEFT_PX)}px)`);
        expect(wrapper.get('[data-region="Width"]').text()).toBe(String(COLUMN_START_SIZE_PX));

        await endDrag(DRAG_START_X_PX + 40);

        expect(wrapper.find('[data-region="TableResizeLine"]').exists()).toBe(false);
        expect(wrapper.get('[data-region="Width"]').text()).toBe(String(COLUMN_START_SIZE_PX + 40));
        vi.unstubAllGlobals();
    });

    it('stops at the column minimum when the cursor passes it', async () => {
        vi.stubGlobal('requestAnimationFrame', undefined);
        const wrapper = mountHarness();

        await wrapper.get('[role="button"]').trigger('mousedown', { clientX: DRAG_START_X_PX });
        await moveTo(DRAG_START_X_PX - 120);

        expect(getLineLeft(wrapper)).toBe(`translateX(${String(HANDLE_LEFT_PX - 50 - HEADER_LEFT_PX)}px)`);

        await endDrag(DRAG_START_X_PX - 120);
        vi.unstubAllGlobals();
    });
});
