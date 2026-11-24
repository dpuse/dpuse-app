// The figures the audit and the load show in their status bars, formatted the same way on both steps.

// ── DPUse Framework
import { formatNumberAsDecimalNumber } from '@dpuse/dpuse-shared';

// ── Local Framework
import { localeId } from '@/state/locale';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Up to two decimal places, rounded down so part of an item never reads as 100. A share too small to show reads as under
// the smallest one that can be shown, rather than as 0.
export function formatStatusPercentage(percentage: number): string {
    const shownPercentage = Math.floor(percentage * 100) / 100;
    const isTooSmallToShow = percentage > 0 && shownPercentage === 0;
    const percentageText = formatNumberAsDecimalNumber(isTooSmallToShow ? 0.01 : shownPercentage, 2, 0, localeId.value);
    return isTooSmallToShow ? `<${percentageText}` : percentageText;
}

// Whole seconds, so a time that counts up does not flicker.
export function formatElapsedDuration(milliseconds: number): string {
    return new Intl.NumberFormat(localeId.value, { maximumFractionDigits: 0, style: 'unit', unit: 'second' }).format(Math.floor(milliseconds / 1000));
}

// One decimal place, with more only for a time too short to show in one, so a quick read does not read as 0. A time under
// 0.01 seconds reads as under that limit.
export function formatFinishedDuration(milliseconds: number): string {
    const secondsFormat = new Intl.NumberFormat(localeId.value, {
        style: 'unit',
        unit: 'second',
        maximumFractionDigits: 1,
        maximumSignificantDigits: 1,
        minimumFractionDigits: 1,
        minimumSignificantDigits: 1,
        roundingPriority: 'morePrecision'
    });
    const seconds = milliseconds / 1000;
    return seconds < 0.01 ? `<${secondsFormat.format(0.01)}` : secondsFormat.format(seconds);
}
