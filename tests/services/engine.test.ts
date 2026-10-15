// ── External Dependencies & Registrations
import { describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import type { EngineConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { establishEngineWorker } from '@/services/engine';
import { hasReportedAppError } from '@/observability/errorTracking';
import { configStatus, engineConfig } from '@/state/configs';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('establishEngineWorker', () => {
    // The engine is imported from the engine host by URL, which a test cannot fetch, so the load fails as it would offline.
    it('reports the failure once and passes it to every caller that was waiting for the engine', async () => {
        engineConfig.value = { version: '1.0.0' } as unknown as EngineConfig;
        configStatus.value = { typeId: 'ready' };
        vi.mocked(hasReportedAppError).mockClear();

        const results = await Promise.allSettled([establishEngineWorker(), establishEngineWorker()]);

        expect(results.map((result) => (result.status === 'rejected' ? (result.reason as Error).message : result.status))).toStrictEqual([
            'Failed to load engine v1.0.0.',
            'Failed to load engine v1.0.0.'
        ]);
        expect(vi.mocked(hasReportedAppError).mock.calls.map((call) => call[0].message)).toStrictEqual(['Failed to load engine v1.0.0.']);
    });
});
