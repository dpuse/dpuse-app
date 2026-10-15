// ── External Dependencies & Registrations
import { afterEach, describe, expect, it } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';

// ── Local Framework
import { unsavedWorkIsPresent, useUnsavedWork } from '@/state/unsavedWork';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const scopes: ReturnType<typeof effectScope>[] = [];

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Stands in for a mounted screen: stopping the scope is the screen closing.
function openScreen(hasUnsavedWork: boolean): { scope: ReturnType<typeof effectScope>; work: ReturnType<typeof ref<boolean>> } {
    const work = ref(hasUnsavedWork);
    const scope = effectScope();
    scope.run(() => {
        useUnsavedWork(work);
    });
    scopes.push(scope);
    return { scope, work };
}

// True when the browser would be asked to warn before the page goes away.
function leavingIsBlocked(): boolean {
    const event = new Event('beforeunload', { cancelable: true });
    dispatchEvent(event);
    return event.defaultPrevented;
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('useUnsavedWork', () => {
    afterEach(() => {
        for (const scope of scopes.splice(0)) scope.stop();
    });

    it('reports unsaved work only while a screen says it has some', () => {
        const { work } = openScreen(false);
        expect(unsavedWorkIsPresent.value).toBe(false);

        work.value = true;
        expect(unsavedWorkIsPresent.value).toBe(true);
    });

    it('stops reporting once the screen closes, so a closed screen cannot leave the warning on', () => {
        const { scope } = openScreen(true);
        expect(unsavedWorkIsPresent.value).toBe(true);

        scope.stop();

        expect(unsavedWorkIsPresent.value).toBe(false);
    });

    it('keeps the warning while any screen still has work, after another clears its own', () => {
        const first = openScreen(true);
        openScreen(true);

        first.work.value = false;

        expect(unsavedWorkIsPresent.value).toBe(true);
    });

    it('asks the browser to warn before leaving only while there is unsaved work', async () => {
        const { work } = openScreen(true);
        await nextTick(); // The listener is attached by a watcher, a tick after the work appears.
        expect(leavingIsBlocked()).toBe(true);

        work.value = false;
        await nextTick();
        expect(leavingIsBlocked()).toBe(false);
    });
});
