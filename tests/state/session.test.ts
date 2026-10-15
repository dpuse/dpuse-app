// ── External Dependencies & Registrations
import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const FAILED_FETCH_MESSAGE = 'Failed to fetch dynamically imported module.';
const MOCKED_MODULE_IDS = ['@/observability/accountMonitor', '@/observability/eventTracking', '@/observability/performanceTracking', '@/services/auth', '@/state/configs', '@teamhanko/hanko-frontend-sdk'];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Each test starts the session services against fresh modules, with one service's code unable to be fetched. The
// configuration services are left out, because they are not what these tests are about.
describe('initialiseServices', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.doMock('@/state/configs', async (importOriginal) => ({
            // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
            ...(await importOriginal<typeof import('@/state/configs')>()),
            initialiseConfigMonitor: vi.fn(),
            initialiseContextConfig: vi.fn()
        }));
    });

    afterEach(() => {
        for (const moduleId of MOCKED_MODULE_IDS) vi.doUnmock(moduleId);
    });

    it('shows the failure and treats the user as signed out when the sign-in code cannot be fetched', async () => {
        vi.doMock('@teamhanko/hanko-frontend-sdk', () => {
            throw new TypeError(FAILED_FETCH_MESSAGE);
        });
        const errors = await import('@/state/errors');
        const session = await import('@/state/session');

        session.initialiseServices();
        await flushPromises();

        expect(errors.appFailures.value.map((failure) => failure.error.message)).toStrictEqual(['Failed to load the authentication service.']);
        expect(session.sessionIsAuthenticated.value).toBe(false);
    });

    it("shows the failure when a signed-in user's account code cannot be fetched", async () => {
        const claims = { expiration: new Date(Date.now() + 60_000).toISOString(), session_id: 'session-1', subject: 'user-1' };
        vi.doMock('@/services/auth', () => ({ loadAuthClient: vi.fn(() => Promise.resolve()), validateAuthSession: vi.fn(() => Promise.resolve(claims)) }));
        vi.doMock('@/observability/accountMonitor', () => {
            throw new TypeError(FAILED_FETCH_MESSAGE);
        });
        vi.doMock('@/observability/eventTracking', async (importOriginal) => ({
            // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
            ...(await importOriginal<typeof import('@/observability/eventTracking')>()),
            forgetUser: vi.fn(),
            identifyUser: vi.fn()
        }));
        vi.doMock('@/observability/performanceTracking', () => ({ initialise: vi.fn() }));
        const configs = await import('@/state/configs');
        const errors = await import('@/state/errors');
        const session = await import('@/state/session');

        session.initialiseServices();
        await flushPromises();

        expect(errors.appFailures.value.map((failure) => failure.error.message)).toStrictEqual(['Failed to load the account service.']);
        expect(configs.accountConfigStatus.value.typeId).toBe('failed');
    });
});
