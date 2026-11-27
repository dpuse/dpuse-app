// ── External Dependencies & Registrations
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Local Framework
import { useStudioOptionTint } from '@/features/studio/options/useStudioOptions';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

vi.mock('vue-router', () => ({ useRoute: (): object => route }));

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = reactive({ path: '/' });
const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('useStudioOptionTint', () => {
    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
    });

    it('names the studio option on screen on the page’s root, from the first part of the path, and no option where there is none', async () => {
        route.path = '/dataViews/list/a';
        mountTint();
        await nextTick();
        expect(document.documentElement.dataset.studioOption).toBe('dataViews');

        route.path = '/eventQueries';
        await nextTick();
        expect(document.documentElement.dataset.studioOption).toBe('eventQueries');

        route.path = '/somewhereElse';
        await nextTick();
        expect(document.documentElement.dataset.studioOption).toBeUndefined();
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountTint(): void {
    wrappers.push(
        mount(
            defineComponent({
                setup() {
                    useStudioOptionTint();
                    return renderNothing;
                }
            })
        )
    );
}

function renderNothing(): ReturnType<typeof h> {
    return h('div');
}
