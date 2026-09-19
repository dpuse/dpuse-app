// The appearance the styled button types share. Held beside them rather than inside any one of them, because
// '<script setup>' cannot export a value and two of the three need the same class strings.

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type ButtonShape = 'round' | 'square'; // 'square' for navigation and labelled tiles; 'round' for actions.
export type ButtonSize = 'lg' | 'sm';
export type ButtonType = 'button' | 'submit';
export type ButtonVariant = 'destructive' | 'ghost' | 'guarded' | 'neutral' | 'outline' | 'primary';

// ── Data ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Fills, keyed by variant. 'positive' is absent deliberately: it had no call sites, and a variant nothing uses is a
// promise the design has not had to keep.
export const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    destructive: 'bg-danger hover:bg-danger-hover active:bg-danger-active text-danger-text',
    // 'active:scale' only here: a ghost button has no fill to darken on press, so the shrink is the whole of its
    // feedback. The filled variants say the same thing with 'active:bg-*' and would read as jittery with both.
    ghost: 'bg-transparent hover:bg-zinc-100 active:scale-[92%] active:bg-zinc-200 dark:hover:bg-zinc-300/25 dark:active:bg-zinc-300/35 dark:text-content',
    guarded: 'bg-warning hover:bg-warning-hover active:bg-warning-active text-warning-text',
    neutral: 'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-emphasis dark:bg-zinc-300/20 dark:hover:bg-zinc-300/35 dark:active:bg-zinc-300/45 dark:text-content',
    outline: 'bg-transparent inset-ring inset-ring-separator hover:bg-zinc-100 active:bg-zinc-200 dark:hover:bg-zinc-300/25 dark:active:bg-zinc-300/35 dark:text-content',
    primary: 'bg-info hover:bg-info-hover active:bg-info-active text-info-text'
};

// Press feedback for icon buttons, selected or not. The press shows at once and fades on release, so even a quick tap,
// which ends before a fade-in could finish, leaves something to see. 'touch-manipulation' drops the wait for a possible
// double-tap zoom.
export const PRESS_CLASSES = 'touch-manipulation duration-200 active:scale-[92%] active:duration-0';

// Hover and press for an icon button that is not selected. Translucent, because a solid grey that shows on white barely
// shows on the grey option bar.
export const UNSELECTED_CLASSES = 'hover:bg-black/5 active:bg-black/14 dark:hover:bg-white/7 dark:active:bg-white/18';

// Replaces the variant's fill rather than adding to it, because two 'hover:bg-*' classes are settled by stylesheet order,
// not class order. A neutral grey, so it does not clash with multicoloured icons, and darker than hover, because the
// fill alone is what tells the two apart. Translucent, so one shade reads the same over the grey rail and white panes.
export const SELECTED_CLASSES = 'bg-black/10 hover:bg-black/13 active:bg-black/18 dark:bg-white/14 dark:hover:bg-white/18 dark:active:bg-white/26';

// The selected option inside a grey pill track: a raised white segment, as in a segmented control. The track is
// already grey, so a grey fill would barely show there.
export const SEGMENT_SELECTED_CLASSES =
    'bg-white shadow-xs inset-ring inset-ring-black/8 hover:bg-zinc-50 active:bg-zinc-100 dark:bg-white/14 dark:inset-ring-white/8 dark:hover:bg-white/18 dark:active:bg-white/26';

// The blue pill of a page's floating primary action — open, select, add. Fill kept apart so a host can swap it.
export const PILL_CLASSES = 'rounded-full border border-selected-border text-selected-text';
export const PILL_FILL_CLASSES = 'bg-selected hover:bg-selected-hover';

// Icon buttons size by padding around a glyph rather than by a fixed box, so a button is always its icon plus the same
// margin whatever the icon is. The glyph size is set here too, or every call site would have to state it and they
// would drift — four different glyph sizes across five buttons is where this started.
export const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
    lg: 'p-1.75 [&_svg]:size-6.5',
    sm: 'p-1.75 [&_svg]:size-5'
};
