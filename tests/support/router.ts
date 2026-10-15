// ── External Dependencies & Registrations
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A router with one empty screen, for code that reads or writes the URL without needing the app's own routes.
export async function buildMemoryRouter(query = ''): Promise<Router> {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] });
    await router.push(`/${query}`);
    await router.isReady();
    return router;
}
