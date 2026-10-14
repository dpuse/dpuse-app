import { flushPromises } from '@vue/test-utils';
import { replaceRouteQuery } from '@/router';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { describe, expect, it } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function buildRouter(query = ''): Promise<Router> {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] });
    await router.push(`/${query}`);
    await router.isReady();
    return router;
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('replaceRouteQuery', () => {
    it('keeps both changes made in the same tick', async () => {
        const router = await buildRouter('?keep=1');

        void replaceRouteQuery(router, { dlg: 'account' });
        void replaceRouteQuery(router, { studio: '1' });
        await flushPromises();

        expect(router.currentRoute.value.query).toStrictEqual({ dlg: 'account', keep: '1', studio: '1' });
    });

    it('keeps an earlier change when a later one is made before the first write finishes', async () => {
        const router = await buildRouter();

        const first = replaceRouteQuery(router, { dlg: 'account' });
        await Promise.resolve(); // The first write has started but not finished.
        const second = replaceRouteQuery(router, { lState: '1' });
        await Promise.all([first, second]);

        expect(router.currentRoute.value.query).toStrictEqual({ dlg: 'account', lState: '1' });
    });

    it('removes a parameter set to undefined', async () => {
        const router = await buildRouter('?dlg=account&keep=1');

        await replaceRouteQuery(router, { dlg: undefined });

        expect(router.currentRoute.value.query).toStrictEqual({ keep: '1' });
    });
});
