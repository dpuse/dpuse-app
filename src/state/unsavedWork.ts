// ── External Dependencies & Registrations
import { useEventListener } from '@vueuse/core';
import { computed, type MaybeRefOrGetter, onScopeDispose, shallowRef, toValue } from 'vue';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Reports unsaved work for as long as the calling component is mounted, so a screen that closes can never leave the
// warning switched on.
export function useUnsavedWork(source: MaybeRefOrGetter<boolean>): void {
    unsavedWorkSources.value = [...unsavedWorkSources.value, source];
    onScopeDispose(() => {
        unsavedWorkSources.value = unsavedWorkSources.value.filter((candidate) => candidate !== source);
    });
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// One entry per screen with something to lose. A list rather than a single flag, so one screen clearing its own work
// cannot switch off the warning while another still has some.
const unsavedWorkSources = shallowRef<MaybeRefOrGetter<boolean>[]>([]);

const state = { reloadIsConfirmed: false }; // Set once the user has agreed in the app's own dialog, so they are not asked twice.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

export const unsavedWorkIsPresent = computed(() => unsavedWorkSources.value.some((source) => toValue(source)));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Attached only while there is unsaved work, because the handler always asks the user to confirm leaving. It covers
// what the app cannot intercept itself: a manual reload, closing the tab and typing another address.
// eslint-disable-next-line unicorn/no-top-level-side-effects -- An app-lifetime singleton, so the listener belongs to the module rather than a component.
useEventListener(() => (unsavedWorkIsPresent.value ? globalThis : undefined), 'beforeunload', handleBeforeUnload);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (state.reloadIsConfirmed) return;
    event.preventDefault();
    // eslint-disable-next-line sonarjs/deprecation, @typescript-eslint/no-deprecated -- Chrome and Edge before version 119 show the prompt only when 'returnValue' is set.
    event.returnValue = '';
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Reloads after the user has already confirmed in the app's own dialog, so the browser's generic warning is skipped.
export function reloadWithConfirmedLoss(): void {
    state.reloadIsConfirmed = true;
    location.reload();
}
