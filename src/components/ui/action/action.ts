// The appearance the styled button types share. Held beside them rather than inside any one of them, because
// '<script setup>' cannot export a value and two of the three need the same class strings.

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

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

// Icon buttons size by padding around a glyph rather than by a fixed box, so a button is always its icon plus the same
// margin whatever the icon is. The glyph size is set here too, or every call site would have to state it and they
// would drift — four different glyph sizes across five buttons is where this started.
export const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
    lg: 'p-1.75 [&_svg]:size-6.5',
    sm: 'p-1.75 [&_svg]:size-5'
};
