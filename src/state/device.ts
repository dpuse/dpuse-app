// ── External Dependencies & Registrations
import { useMediaQuery } from '@vueuse/core';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const isPWA = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches; // Read once at load, because an installed app keeps its display mode while it runs.
export const pointerIsCoarse = useMediaQuery('(pointer: coarse)'); // Same query as Tailwind's 'pointer-coarse:', so a script and a template agree.
export const viewportIsWide = useMediaQuery('(min-width: 48rem)'); // Same width as Tailwind's 'md' (48rem), so a script and a template agree.
