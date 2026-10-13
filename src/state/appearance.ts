// ── External Dependencies & Registrations
import { useColorMode } from '@vueuse/core';
import { computed, type ComputedRef } from 'vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Shares the 'dpuse-appearance' local storage key and the 'dark' class with the inline script in 'index.html', which
// applies the appearance before the app loads. Transitions are left on because switching them off injects a '<style>'
// element, which the production CSP blocks. Light mode sets no class of its own.
export const appearance = useColorMode({ disableTransition: false, modes: { light: '' }, storageKey: 'dpuse-appearance' });

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

export const appearanceIsDark: ComputedRef<boolean> = computed(() => appearance.state.value === 'dark');
