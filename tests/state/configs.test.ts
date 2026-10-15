// ── External Dependencies & Registrations
import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Local Framework
import { buildFailedRetrievalStatus } from '~/tests/support/failures';
import { configStatus, initialiseConfigMonitor, useConfigsReady } from '@/state/configs';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

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
        configStatus.value = buildFailedRetrievalStatus();

        await expect(ready).resolves.toBeUndefined();
    });
});

describe('initialiseConfigMonitor', () => {
    it('shows the failure on each screen that needs the configuration when its code cannot be fetched', async () => {
        vi.doMock('@/observability/configMonitor', () => {
            throw new TypeError('Failed to fetch dynamically imported module.');
        });
        await initialiseConfigMonitor();
        vi.doUnmock('@/observability/configMonitor');

        expect(configStatus.value.typeId === 'failed' ? configStatus.value.failure.error.message : undefined).toBe('Failed to load the configuration service.');
    });
});
