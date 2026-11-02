// ── External Dependencies & Registrations
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Local Framework
import { constructFittedColumnWidth } from '@/components/ui/table/tableColumnWidth';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// jsdom lays nothing out, so each character of an element's longest line measures 10px.
describe('constructFittedColumnWidth', () => {
    beforeEach(() => {
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
            const longestLineLength = Math.max(...this.textContent.split('\n').map((line) => line.length));
            return { width: longestLineLength * 10 } as DOMRect;
        });
    });

    it('fits the widest value, with the cell padding', () => {
        expect(constructFittedColumnWidth('Id', ['abc', 'abcdefgh'])).toBe(104);
    });

    it('fits the label and what sits beside it when they are wider than the values', () => {
        expect(constructFittedColumnWidth('Birth date', ['1'], { headerExtraPx: 24 })).toBe(148);
    });

    it('adds the room a cell needs beside its value', () => {
        expect(constructFittedColumnWidth('Id', ['abcd'], { cellExtraPx: 20 })).toBe(84);
    });

    it('stops at the limit however long a value is', () => {
        expect(constructFittedColumnWidth('Id', ['x'.repeat(500)])).toBe(320);
    });

    it('goes past the limit when the caller raises it', () => {
        expect(constructFittedColumnWidth('Id', ['x'.repeat(50)], { maximumWidthPx: Infinity })).toBe(524);
    });

    it('leaves nothing on the page', () => {
        constructFittedColumnWidth('Id', ['abc']);

        expect(document.body.children).toHaveLength(0);
    });
});
