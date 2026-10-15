// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { raiseFailure } from '@/state/errors';
import type { RetrievalStatus } from '@/state/configs';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Raises a real failure, so the test needs '@/observability/errorTracking' mocked to stay off the network.
export function buildFailedRetrievalStatus(): RetrievalStatus {
    return { typeId: 'failed', failure: raiseFailure(new AppError('Unable to connect to DPUse.', 'dpuse-app.test', { typeId: 'handled' })) };
}
