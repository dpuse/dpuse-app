// ── External Dependencies & Registrations
import { vi } from 'vitest';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Stands in for '@/observability/errorTracking', so a test never posts a report to the DPUse API. Used as
// "vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'))". Every report succeeds
// unless a test says otherwise with 'mockResolvedValueOnce'.
export const hasReportedAppError = vi.fn(() => Promise.resolve(true));
export const logError = vi.fn();
