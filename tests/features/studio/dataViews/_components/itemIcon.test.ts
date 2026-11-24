// ── External Dependencies & Registrations
import { BracesIcon, FileIcon, SheetIcon } from '@lucide/vue';
import { describe, expect, it } from 'vitest';

// ── Local Framework
import { DATA_FORMAT_ICON_CONFIGS } from '@/features/studio/dataViews/_components/dataFormatIcons';
import { resolveItemIcon } from '@/features/studio/dataViews/_components/itemIcon';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const NO_ICON = { icon: null, iconDark: null };

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('resolveItemIcon', () => {
    it('shows an item’s own icon ahead of its format', () => {
        const ownIcon = { icon: '<svg data-id="own"/>', iconDark: null };

        expect(resolveItemIcon(ownIcon, 'dtv', 'file')).toStrictEqual({ configIcon: ownIcon });
    });

    it('shows a previewed file’s format icon', () => {
        expect(resolveItemIcon(NO_ICON, 'dtv', 'file')).toStrictEqual({ configIcon: DATA_FORMAT_ICON_CONFIGS.dtv });
    });

    it('shows a grey file icon for a file not yet previewed or of an unknown format', () => {
        expect(resolveItemIcon(NO_ICON, undefined, 'file')).toStrictEqual({ icon: FileIcon, iconStrokeWidth: 1.5 });
        expect(resolveItemIcon(NO_ICON, 'unknown', 'file')).toStrictEqual({ icon: FileIcon, iconStrokeWidth: 1.5 });
    });

    it.each([
        ['table', SheetIcon],
        ['apiEndpoint', BracesIcon],
        [undefined, SheetIcon]
    ] as const)('shows the green kind icon for a %s item, whatever its format', (itemTypeId, icon) => {
        expect(resolveItemIcon(NO_ICON, 'dtv', itemTypeId)).toStrictEqual({ icon, iconClass: 'text-[#488f86]', iconStrokeWidth: 1.75 });
    });
});
