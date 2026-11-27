// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── Local Framework
import { constructCardTitleRowHeight, useCardRowHeight } from '@/components/ui/config/configCard';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructCardTitleRowHeight', () => {
    it('fits two detail lines, and grows by a line for each one more', () => {
        expect(constructCardTitleRowHeight(2)).toBe(68);
        expect(constructCardTitleRowHeight(4)).toBe(116);
    });

    it('is never shorter than two lines', () => {
        expect(constructCardTitleRowHeight(1)).toBe(68);
    });
});

describe('useCardRowHeight', () => {
    it('sizes a row for a plain card, a card with actions, and a card with detail lines', () => {
        expect(useCardRowHeight(false).value).toBe(68); // The grid's 16px gap, the card's 24px padding and one 28px row.
        expect(useCardRowHeight(true).value).toBe(108); // And a 12px gap and a 28px footer row.
        expect(useCardRowHeight(true, 4).value).toBe(196); // The title row grows from 28px to 116px.
    });
});
