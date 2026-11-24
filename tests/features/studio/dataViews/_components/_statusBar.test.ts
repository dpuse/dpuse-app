// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── Local Framework
import { localeId } from '@/state/locale';
import { formatElapsedDuration, formatFinishedDuration, formatStatusPercentage } from '@/features/studio/dataViews/_components/_statusBar';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('formatStatusPercentage', () => {
    it('shows up to two decimal places, rounded down so part of an item never reads as all of it', () => {
        expect(formatStatusPercentage(45)).toBe(formatNumber(45));
        expect(formatStatusPercentage(12.3456)).toBe(formatNumber(12.34));
        expect(formatStatusPercentage(99.999)).toBe(formatNumber(99.99));
    });

    it('shows a share too small to show as under the smallest one that can be, rather than as 0', () => {
        expect(formatStatusPercentage(0.001)).toBe(`<${formatNumber(0.01)}`);
        expect(formatStatusPercentage(0)).toBe(formatNumber(0));
    });
});

describe('formatElapsedDuration', () => {
    it('counts in whole seconds, rounded down, so a running time does not flicker', () => {
        expect(formatElapsedDuration(4999)).toBe(formatSeconds(4, 0));
        expect(formatElapsedDuration(0)).toBe(formatSeconds(0, 0));
    });
});

describe('formatFinishedDuration', () => {
    it('shows one decimal place', () => {
        expect(formatFinishedDuration(11_240)).toBe(formatSeconds(11.2, 1));
    });

    it('shows more places for a time too short to show in one, and a tiny time as under 0.01 seconds', () => {
        expect(formatFinishedDuration(42)).toBe(formatSeconds(0.04, 2));
        expect(formatFinishedDuration(3)).toBe(`<${formatSeconds(0.01, 2)}`);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function formatNumber(value: number): string {
    return new Intl.NumberFormat(localeId.value, { maximumFractionDigits: 2 }).format(value);
}

function formatSeconds(seconds: number, fractionDigits: number): string {
    return new Intl.NumberFormat(localeId.value, { maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits, style: 'unit', unit: 'second' }).format(seconds);
}
