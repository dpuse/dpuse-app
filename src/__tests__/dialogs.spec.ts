import { createApp } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { useDialogs } from '@/state/dialogs';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { describe, expect, it } from 'vitest';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type Dialogs = ReturnType<typeof useDialogs>;

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// 'useDialogs' injects the route, so it has to run under an app the router is installed on. 'runWithContext' supplies
// that without a host component, which keeps each test driving the composable directly rather than through whichever
// button happens to call it.
async function buildDialogs(query = ''): Promise<{ dialogs: Dialogs; router: Router }> {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] });
    await router.push(`/${query}`);
    await router.isReady();

    const app = createApp({ render: () => null });
    app.use(router);

    return { dialogs: app.runWithContext(() => useDialogs()), router };
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('useDialogs', () => {
    it('resolves the dialog the URL asks for', async () => {
        const { dialogs } = await buildDialogs('?dlg=auth');

        expect(dialogs.activeDialogId.value).toBe('auth');
        expect(dialogs.activeDialogConfig.value?.sizing).toBe('reserved');
    });

    it('ignores a "dlg" value that names no dialog', async () => {
        const { dialogs } = await buildDialogs('?dlg=nonsense');

        expect(dialogs.activeDialogId.value).toBeUndefined();
        expect(dialogs.activeDialogConfig.value).toBeUndefined();
    });

    it('opens a dialog without disturbing the rest of the query', async () => {
        const { dialogs, router } = await buildDialogs('?keep=1');

        await dialogs.openDialog('connection');

        expect(router.currentRoute.value.query.dlg).toBe('connection');
        expect(router.currentRoute.value.query.keep).toBe('1');
    });

    it('clears only "dlg" when a dialog closes', async () => {
        const { dialogs, router } = await buildDialogs('?dlg=account&keep=1');

        dialogs.closeDialog();
        await flushPromises(); // Closing navigates, which settles a tick later than the call.

        expect(router.currentRoute.value.query.dlg).toBeUndefined();
        expect(router.currentRoute.value.query.keep).toBe('1');
    });

    it('does not navigate when there is no dialog to close', async () => {
        const { dialogs, router } = await buildDialogs('?keep=1');
        const { fullPath } = router.currentRoute.value;

        dialogs.closeDialog();
        await flushPromises();

        expect(router.currentRoute.value.fullPath).toBe(fullPath);
    });
});
