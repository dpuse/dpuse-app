// ── External Dependencies & Registrations
import { useMediaQuery } from '@vueuse/core';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const isPWA = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches; // Read once at load, because an installed app keeps its display mode while it runs.
export const pointerIsCoarse = useMediaQuery('(pointer: coarse)'); // Same query as Tailwind's 'pointer-coarse:', so a script and a template agree.
export const viewportIsWide = useMediaQuery('(min-width: 48rem)'); // Same width as Tailwind's 'md' (48rem), so a script and a template agree.

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Read from the user agent because no feature test tells Safari apart. iPadOS Safari reports itself as macOS, and every
// iOS browser also names Safari, so the other browsers are excluded by their own tokens.
export function isSafariBrowser(): boolean {
    return /^(?:(?!chrome|chromium|android|crios|edgios|fxios).)*safari/i.test(navigator.userAgent);
}
