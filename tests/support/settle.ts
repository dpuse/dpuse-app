// ── External Dependencies & Registrations
import { flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A lazy component resolves its loader, renders, then renders its own children, each a promise and a tick apart. One
// flush is not enough to reach the final screen, so this waits through several rounds.
export async function settle(rounds = 6): Promise<void> {
    for (let index = 0; index < rounds; index++) {
        await flushPromises();
        await nextTick();
    }
}
