// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import { clearAppFailures, raiseAppFailure } from '@/state/errors';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('ErrorNotice', () => {
    beforeEach(() => {
        clearAppFailures();
    });

    it('lists every failure in one body, so losing the network reads as one thing rather than four', async () => {
        const failures = [
            raiseAppFailure(new AppError('Failed to load the authentication service.', 'test'), { capability: 'authentication' }),
            raiseAppFailure(new AppError('Failed to load the configuration service.', 'test'), { capability: 'configuration' }),
            raiseAppFailure(new AppError('Failed to load the engine.', 'test'), { capability: 'engine' })
        ];
        const wrapper = mount(ErrorNotice, { attachTo: document.body, props: { canRetry: false, failures, ownsScreen: true } });
        await nextTick();

        expect(wrapper.findAll('[data-region="ErrorBody"]')).toHaveLength(1);
        for (const failure of failures) expect(wrapper.text()).toContain(failure.error.message);
    });

    it('takes the screen for a failure no region owns, since that is the space it has lost', async () => {
        const failures = [raiseAppFailure(new AppError('Unhandled Vue error.', 'test'))];
        const wrapper = mount(ErrorNotice, { attachTo: document.body, props: { canRetry: false, failures, ownsScreen: true } });
        await nextTick();

        // A modal, not a lock: it is opened by the failure and closed by the user, which the 'dismiss' emit reports.
        expect(wrapper.find('dialog').element.open).toBe(true);
    });
});
