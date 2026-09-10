// The split state 'GridDetailPanel' publishes, held beside it rather than inside it because '<script setup>' cannot
// export a value and the descendants that read it are not its own children.

// ── External Dependencies & Registrations
import type { InjectionKey, Ref } from 'vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Below this the panel has room for one pane at a time, so selecting an item replaces the list rather than filling a
// pane beside it. Measured on the panel itself, never on the viewport: the panel sits inside an app pane the splitter
// resizes, which changes its width without the viewport moving and so is invisible to a media query.
export const GRID_DETAIL_SPLIT_THRESHOLD_PX = 768;

// Whether the list and the detail are showing side by side. Provided by 'GridDetailPanel' for the descendants whose own
// layout turns on the same fact — a detail header offers no way back while the list it would return to is still on
// screen — and those sit several components below the slot, too far down to reach with a prop. Absent where no panel is
// above, which is the standalone case, and the fallback there is 'not split': that keeps the way back rather than
// stranding the user in a panel with no exit.
export const gridDetailIsSplitKey: InjectionKey<Ref<boolean>> = Symbol('gridDetailIsSplit');
