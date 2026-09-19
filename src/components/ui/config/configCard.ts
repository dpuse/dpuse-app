// The action contract a ConfigCard's host fills in. Held beside the component rather than inside it, because
// '<script setup>' cannot export a value and call sites need the type to declare their own action lists.

// ── External Dependencies & Registrations ────────────────────────────────────────────────────────────────────────────
import { computed, type ComputedRef } from 'vue';

// ── DPUse Framework
import type { BaseConfig } from '@dpuse/dpuse-shared';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { pointerIsCoarse } from '@/state/appLayout';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type ActionTypeId = 'delete' | 'info' | 'open';
export type StatusColor = 'danger' | 'info' | 'success' | 'warning';

export interface Badge {
    id: string;
    color?: StatusColor; // Omitted for a neutral grey dot.
    label: string;
}

export interface Action<T extends BaseConfig = BaseConfig> {
    typeId: ActionTypeId;
    label?: string; // Replaces the generic screen-reader name, e.g. to say where 'open' leads.
    onClick: (item: LocalisedConfig<T>) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// A full-size card's metrics, in px. The card's classes state the same numbers — 'p-3', 'gap-y-3', 'h-7' and
// 'pointer-coarse:h-8.5' — so a change to one must be made to the other.
const CARD_PADDING_PX = 12;
const CARD_ROW_GAP_PX = 12;
const CARD_ROW_HEIGHT_PX = 28;
const CARD_ROW_HEIGHT_COARSE_PX = 34; // The footer row on touch, where the action buttons grow to a comfortable target.
const GRID_CELL_GAP_PX = 16; // 'Grid' leaves this above each full-size cell.

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// The grid row height for full-size cards, so hosts size the virtualiser's rows from the card rather than restating
// its sum. 'hasFooter' is whether the cards carry badges or actions, which take a second row.
export function useCardRowHeight(hasFooter: boolean): ComputedRef<number> {
    return computed(() => {
        const cardHeight = CARD_PADDING_PX * 2 + CARD_ROW_HEIGHT_PX;
        if (!hasFooter) return GRID_CELL_GAP_PX + cardHeight;
        const footerRowHeight = pointerIsCoarse.value ? CARD_ROW_HEIGHT_COARSE_PX : CARD_ROW_HEIGHT_PX;
        return GRID_CELL_GAP_PX + cardHeight + CARD_ROW_GAP_PX + footerRowHeight;
    });
}
