import { useSplitPanes } from '@/composables/useSplitPanes';
import { describe, expect, it } from 'vitest';
import { type Ref, ref } from 'vue';

// The assistant's inner split runs this model, and a pane that is open but never in front is invisible on a narrow
// container — so 'active' and 'visible' have to stay distinct, and the front pane has to follow every change.
function build(isWide: boolean): { containerIsWide: Ref<boolean>; panes: ReturnType<typeof useSplitPanes<'chat' | 'library'>> } {
    const containerIsWide = ref(isWide);
    return { containerIsWide, panes: useSplitPanes(['chat', 'library'] as const, { containerIsWide, initialPaneId: 'chat' }) };
}

describe('split panes', () => {
    it('puts the pane just switched on in front, and the other one when a pane is switched off', () => {
        const { panes } = build(true);

        panes.setPaneActiveState('chat', true);
        expect(panes.activePaneId.value).toBe('chat');

        panes.setPaneActiveState('library', true);
        expect(panes.activePaneId.value).toBe('library');

        panes.setPaneActiveState('library', false);
        expect(panes.activePaneId.value).toBe('chat');
    });

    it('shows both active panes side by side while wide, and only the front one once narrow', () => {
        const { containerIsWide, panes } = build(true);
        panes.setPaneActiveState('chat', true);
        panes.setPaneActiveState('library', true);

        expect(panes.isPaneVisible('chat')).toBe(true);
        expect(panes.isPaneVisible('library')).toBe(true);

        containerIsWide.value = false;

        // 'library' was switched on last, so it is the one in front.
        expect(panes.isPaneVisible('chat')).toBe(false);
        expect(panes.isPaneVisible('library')).toBe(true);
    });

    it('mounts a splitter only where two active panes are both on screen', () => {
        const { containerIsWide, panes } = build(true);
        panes.setPaneActiveState('chat', true);
        expect(panes.splitterIsVisible.value).toBe(false); // Nothing to divide with one pane open.

        panes.setPaneActiveState('library', true);
        expect(panes.splitterIsVisible.value).toBe(true);

        containerIsWide.value = false;
        expect(panes.splitterIsVisible.value).toBe(false); // One at a time, so there is no boundary to drag.
    });

    it('latches activation so a closed pane keeps what the user left in it', () => {
        const { panes } = build(true);
        expect(panes.wasPaneActivated('library')).toBe(false);

        panes.setPaneActiveState('library', true);
        panes.setPaneActiveState('library', false);

        expect(panes.isPaneActive('library')).toBe(false);
        expect(panes.wasPaneActivated('library')).toBe(true); // Still mounted behind its 'v-show'.
    });
});
