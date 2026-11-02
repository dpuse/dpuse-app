// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CELL_PADDING_PX = 24; // A cell's 'px-3' on both sides, which the header's label shares.
export const HEADER_MENU_WIDTH_PX = 24; // The column options button: a 12px icon and its 'px-1.5'.
const MAXIMUM_FITTED_WIDTH_PX = 320; // So one long value cannot push the other columns out of view. Dragging can still go wider.

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Returns the width that shows a column's label and its widest value, up to a limit. A caller whose values must show in
// full, such as numbers with lined up decimal points, gives a higher limit.
export function constructFittedColumnWidth(label: string, values: string[], { cellExtraPx = 0, headerExtraPx = 0, maximumWidthPx = MAXIMUM_FITTED_WIDTH_PX } = {}): number {
    const labelWidth = measureTextWidth(label, '500') + headerExtraPx;
    const valueWidth = measureTextWidth(values.join('\n'), '400') + cellExtraPx;
    return Math.min(Math.ceil(Math.max(labelWidth, valueWidth) + CELL_PADDING_PX), maximumWidthPx);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Measures on the page rather than on a canvas, because a canvas cannot apply 'tabular-nums' and measures dates and numbers
// several pixels short, which cuts them off. One value on each line makes the element as wide as the widest, in a single
// layout however many values there are. 'text-sm' matches the cells and headers. Digits are always tabular, which at worst
// leaves a text column a pixel or two of extra room.
function measureTextWidth(text: string, fontWeight: string): number {
    const element = document.createElement('div');
    element.className = 'text-sm tabular-nums';
    Object.assign(element.style, { fontWeight, left: '0', position: 'fixed', top: '0', visibility: 'hidden', whiteSpace: 'pre' });
    element.textContent = text;
    document.body.append(element);
    const { width } = element.getBoundingClientRect();
    element.remove();
    return width;
}
