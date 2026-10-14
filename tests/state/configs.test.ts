import { AppError } from '@dpuse/dpuse-shared';
import { raiseFailure } from '@/state/errors';
import RetrievalGate from '@/components/ui/RetrievalGate.vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configStatus, type RetrievalStatus, useConfigsReady } from '@/state/configs';
import { flushPromises, mount } from '@vue/test-utils';

vi.mock('@/observability/errorTracking', () => ({ hasReportedAppError: vi.fn(() => Promise.resolve(true)), logError: vi.fn() }));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildFailedStatus(): RetrievalStatus {
    return { typeId: 'failed', failure: raiseFailure(new AppError('Unable to connect to DPUse.', 'dpuse-app.test', { typeId: 'handled' })) };
}

function mountGate(status: RetrievalStatus): ReturnType<typeof mount> {
    return mount(RetrievalGate, { props: { status }, slots: { default: '<div data-region="TestContent">Loaded.</div>' } });
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('RetrievalGate', () => {
    it('shows a busy bar and no content while pending', () => {
        const wrapper = mountGate({ typeId: 'pending' });

        expect(wrapper.find('[data-region="BusyBar"]').exists()).toBe(true);
        expect(wrapper.find('[data-region="TestContent"]').exists()).toBe(false);
    });

    it('shows the failure, without Retry, and no content when retrieval failed', () => {
        const wrapper = mountGate(buildFailedStatus());

        expect(wrapper.findComponent({ name: 'ErrorNotice' }).props('canRetry')).toBe(false);
        expect(wrapper.find('[data-region="TestContent"]').exists()).toBe(false);
    });

    it('shows the content once ready', () => {
        const wrapper = mountGate({ typeId: 'ready' });

        expect(wrapper.find('[data-region="TestContent"]').exists()).toBe(true);
        expect(wrapper.find('[data-region="BusyBar"]').exists()).toBe(false);
    });
});

describe('useConfigsReady', () => {
    beforeEach(() => {
        configStatus.value = { typeId: 'pending' };
    });

    it('waits while the configuration is pending', async () => {
        const settled = vi.fn();
        void useConfigsReady().then(settled);
        await flushPromises();

        expect(settled).not.toHaveBeenCalled();
    });

    it('resolves once the configuration is ready', async () => {
        const ready = useConfigsReady();
        configStatus.value = { typeId: 'ready' };

        await expect(ready).resolves.toBeUndefined();
    });

    it('resolves rather than rejects when retrieval fails', async () => {
        const ready = useConfigsReady();
        configStatus.value = buildFailedStatus();

        await expect(ready).resolves.toBeUndefined();
    });
});
