// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import ErrorDialog from '@/components/ui/error/ErrorDialog.vue';
import { hasReportedAppError } from '@/observability/errorTracking';
import { settle } from '~/tests/support/settle';
import { clearAppFailures, raiseAppFailure } from '@/state/errors';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('ErrorDialog', () => {
    beforeEach(() => {
        clearAppFailures();
    });

    it('lists every failure in one body, so losing the network reads as one thing rather than four', async () => {
        const failures = [
            raiseAppFailure(new AppError('Failed to load the authentication service.', 'test'), { capability: 'authentication' }),
            raiseAppFailure(new AppError('Failed to load the configuration service.', 'test'), { capability: 'configuration' }),
            raiseAppFailure(new AppError('Failed to load the engine.', 'test'), { capability: 'engine' })
        ];
        const wrapper = mount(ErrorDialog, { attachTo: document.body, props: { canRetry: false, failures } });
        await nextTick();

        expect(wrapper.findAll('[data-region="ErrorBody"]')).toHaveLength(1);
        for (const failure of failures) expect(wrapper.text()).toContain(failure.error.message);
    });

    it('takes the screen for a failure no region owns, since that is the space it has lost', async () => {
        const failures = [raiseAppFailure(new AppError('Unhandled Vue error.', 'test'))];
        const wrapper = mount(ErrorDialog, { attachTo: document.body, props: { canRetry: false, failures } });
        await nextTick();

        // A modal, not a lock: it is opened by the failure and closed by the user, which the 'dismiss' emit reports.
        expect(wrapper.find('dialog').element.open).toBe(true);
    });

    it('tells the user when the error could not be reported, so they know to contact support', async () => {
        vi.mocked(hasReportedAppError).mockResolvedValueOnce(false);
        const failures = [raiseAppFailure(new AppError('Failed to load the engine.', 'test'), { capability: 'engine' })];
        const wrapper = mount(ErrorDialog, { attachTo: document.body, props: { canRetry: false, failures } });
        await settle();

        expect(wrapper.text()).toContain('Unable to confirm this error was logged with DPUse Support.');
    });
});
