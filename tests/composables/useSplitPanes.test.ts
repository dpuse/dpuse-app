// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';
import { type Ref, ref } from 'vue';

// ── Local Framework
import { useSplitPanes } from '@/composables/useSplitPanes';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The assistant's inner split runs this model, and a pane that is open but never in front is invisible on a narrow
// container — so 'open' and 'visible' have to stay distinct, and the front pane has to follow every change.
function build(): { containerIsWide: Ref<boolean>; panes: ReturnType<typeof useSplitPanes<'chat' | 'library'>> } {
    const containerIsWide = ref(true);
    return { containerIsWide, panes: useSplitPanes(['chat', 'library'] as const, { containerIsWide, initialPaneId: 'chat' }) };
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('useSplitPanes', () => {
    it('puts the pane just switched on in front, and the other one when a pane is switched off', () => {
        const { panes } = build();

        panes.setPaneOpenState('chat', true);
        expect(panes.currentPaneId.value).toBe('chat');

        panes.setPaneOpenState('library', true);
        expect(panes.currentPaneId.value).toBe('library');

        panes.setPaneOpenState('library', false);
        expect(panes.currentPaneId.value).toBe('chat');
    });

    it('shows both open panes side by side while wide, and only the front one once narrow', () => {
        const { containerIsWide, panes } = build();
        panes.setPaneOpenState('chat', true);
        panes.setPaneOpenState('library', true);

        expect(panes.isPaneVisible('chat')).toBe(true);
        expect(panes.isPaneVisible('library')).toBe(true);

        containerIsWide.value = false;

        // 'library' was switched on last, so it is the one in front.
        expect(panes.isPaneVisible('chat')).toBe(false);
        expect(panes.isPaneVisible('library')).toBe(true);
    });

    it('mounts a splitter only where two open panes are both on screen', () => {
        const { containerIsWide, panes } = build();
        panes.setPaneOpenState('chat', true);
        expect(panes.splitterIsVisible.value).toBe(false); // Nothing to divide with one pane open.

        panes.setPaneOpenState('library', true);
        expect(panes.splitterIsVisible.value).toBe(true);

        containerIsWide.value = false;
        expect(panes.splitterIsVisible.value).toBe(false); // One at a time, so there is no boundary to drag.
    });

    it('latches opening so a closed pane keeps what the user left in it', () => {
        const { panes } = build();
        expect(panes.wasPaneOpened('library')).toBe(false);

        panes.setPaneOpenState('library', true);
        panes.setPaneOpenState('library', false);

        expect(panes.isPaneOpen('library')).toBe(false);
        expect(panes.wasPaneOpened('library')).toBe(true); // Still mounted behind its 'v-show'.
    });
});
