// ── External Dependencies & Registrations
import { useColorMode } from '@vueuse/core';
import { computed, type ComputedRef } from 'vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Shares the 'dpuse-appearance' local storage key and the 'dark' class with the inline script in 'index.html', which
// applies the appearance before the app loads. Transitions are left on because switching them off injects a '<style>'
// element, which the production CSP blocks. Light mode sets no class of its own.
export const appearance = useColorMode({ disableTransition: false, modes: { light: '' }, storageKey: 'dpuse-appearance' });

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

export const appearanceIsDark: ComputedRef<boolean> = computed(() => appearance.value === 'dark');

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// An icon drawn as an image is one icon, so it is the one for the current appearance. The dark one falls back to the
// light.
export function resolveAppearanceIcon(icon: null | string | undefined, iconDark: null | string | undefined): string | undefined {
    return (appearanceIsDark.value ? (iconDark ?? icon) : icon) ?? undefined;
}
