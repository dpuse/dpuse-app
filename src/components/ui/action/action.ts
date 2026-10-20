// The appearance the styled button types share. Held beside them rather than inside any one of them, because
// '<script setup>' cannot export a value and two of the three need the same class strings.

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type ButtonShape = 'round' | 'square'; // 'square' for navigation and labelled tiles; 'round' for actions.
export type ButtonSize = 'lg' | 'sm';
export type ButtonType = 'button' | 'submit';
export type ButtonVariant = 'destructive' | 'ghost' | 'guarded' | 'neutral' | 'outline' | 'primary';

// ── Data ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Fills, keyed by variant. 'positive' is absent deliberately: it had no call sites, and a variant nothing uses is a
// promise the design has not had to keep. The coloured variants ('destructive', 'guarded', 'primary') have a border,
// and in dark mode a stronger fill, so they stand out. The near-black page hides the 10% tint that the status colours
// give tags and alerts.
export const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    destructive:
        'bg-danger hover:bg-danger-hover active:bg-danger-active text-danger-text inset-ring inset-ring-danger-border dark:bg-danger-hover dark:hover:bg-danger-active dark:active:bg-danger-press',
    // 'active:scale' only here: a ghost button has no fill to darken on press, so the shrink is the whole of its
    // feedback. The filled variants say the same thing with 'active:bg-*' and would read as jittery with both.
    ghost: 'bg-transparent hover:state-hover active:scale-[92%] active:state-press dark:text-content',
    guarded:
        'bg-warning hover:bg-warning-hover active:bg-warning-active text-warning-text inset-ring inset-ring-warning-border dark:bg-warning-hover dark:hover:bg-warning-active dark:active:bg-warning-press',
    neutral: 'bg-zinc-100 hover:state-hover active:state-press text-emphasis dark:bg-zinc-300/20 dark:text-content',
    outline: 'bg-transparent inset-ring inset-ring-separator hover:state-hover active:state-press dark:text-content',
    primary:
        'bg-info hover:bg-info-hover active:bg-info-active text-info-text inset-ring inset-ring-info-border dark:bg-info-hover dark:hover:bg-info-active dark:active:bg-info-press'
};

// Press feedback for icon buttons, selected or not. The press shows at once and fades on release, so even a quick tap,
// which ends before a fade-in could finish, leaves something to see. 'touch-manipulation' drops the wait for a possible
// double-tap zoom.
export const PRESS_CLASSES = 'touch-manipulation duration-200 active:scale-[92%] active:duration-0';

// Hover and press for an icon button that is not selected.
export const UNSELECTED_CLASSES = 'hover:state-hover active:state-press';

// An icon button the user chose from a set, or the place they are, e.g. the current option on the rail. The same blue as
// a selected card, so 'selected' looks the same everywhere.
export const SELECTED_CLASSES = 'state-selected hover:state-selected-hover';

// An on/off toggle that is on, e.g. bold in a text editor. Grey rather than the selected blue, because it is not a
// choice from a set, and darker than hover, because the fill alone tells the two apart.
export const TOGGLED_CLASSES = 'bg-black/6 hover:bg-black/12 active:bg-black/18 dark:bg-white/14 dark:hover:bg-white/18 dark:active:bg-white/26';

// The selected option inside a grey pill track: a raised white segment, as in a segmented control. The track is
// already grey, so a grey fill would barely show there.
export const SEGMENT_SELECTED_CLASSES = 'bg-white shadow-xs inset-ring inset-ring-black/8 hover:state-hover active:state-press dark:bg-white/14 dark:inset-ring-white/8';

// The blue pill of a page's floating primary action — open, select, add. Fill kept apart so a host can swap it.
export const PILL_CLASSES = 'rounded-full border border-selected-border text-selected-text';
export const PILL_FILL_CLASSES = 'bg-pill hover:bg-pill-hover';

// Icon buttons size by padding around a glyph rather than by a fixed box, so a button is always its icon plus the same
// margin whatever the icon is. The glyph size is set here too, or every call site would have to state it and they
// would drift — four different glyph sizes across five buttons is where this started.
// 'lg' holds identity icons (the studio options, the pane toggles' logos), which are cropped to their artwork, so they
// are drawn smaller than a stock Lucide glyph and padded more, keeping the button 40px. 'sm' holds Lucide controls,
// whose padding is built in.
export const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
    lg: 'p-2.25 [&_svg]:size-5.5',
    sm: 'p-1.75 [&_svg]:size-5'
};
