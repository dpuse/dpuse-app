// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { hasReportedAppError } from '@/observability/errorTracking';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface SentEvent {
    errors: { data: unknown; message: string; stack: string | undefined }[];
    isTruncated?: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const MAX_REPORT_BYTES = 48 * 1024;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 200 })));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function sentEvent(): SentEvent {
    const body = fetchMock.mock.calls[0]?.[1]?.body as string;
    return (JSON.parse(body) as { events: SentEvent[] }).events[0];
}

function sentBytes(): number {
    return new TextEncoder().encode(JSON.stringify({ errors: sentEvent().errors })).length;
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('hasReportedAppError', () => {
    beforeEach(() => {
        fetchMock.mockClear();
        vi.stubGlobal('fetch', fetchMock);
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('sends a small report unchanged', async () => {
        await expect(hasReportedAppError(new AppError('Small.', 'test', { id: 'abc' }))).resolves.toBe(true);

        expect(sentEvent().isTruncated).toBeUndefined();
        expect(sentEvent().errors[0]?.data).toStrictEqual({ id: 'abc' });
    });

    it('cuts the stacks first and keeps the data when that is enough', async () => {
        const error = new AppError('Long stack.', 'test', { id: 'abc' });
        error.stack = Array.from({ length: 2000 }, (_, index) => `    at frame${String(index)} (https://example.com/a-long-module-name.js:1:1)`).join('\n');
        await hasReportedAppError(error);

        expect(sentEvent().isTruncated).toBe(true);
        expect(sentEvent().errors[0]?.stack?.split('\n')).toHaveLength(10);
        expect(sentEvent().errors[0]?.data).toStrictEqual({ id: 'abc' });
        expect(sentBytes()).toBeLessThanOrEqual(MAX_REPORT_BYTES);
    });

    it('replaces the data when cutting the stacks is not enough, and keeps the message', async () => {
        await hasReportedAppError(new AppError('Big data.', 'test', { blob: 'x'.repeat(60_000) }));

        expect(sentEvent().isTruncated).toBe(true);
        expect(sentEvent().errors[0]?.data).toStrictEqual({ isTruncated: true });
        expect(sentEvent().errors[0]?.message).toBe('Big data.');
        expect(sentBytes()).toBeLessThanOrEqual(MAX_REPORT_BYTES);
    });

    it('says the report failed when the DPUse API refuses it', async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));

        await expect(hasReportedAppError(new AppError('Refused.', 'test'))).resolves.toBe(false);
    });

    it('says the report failed when the DPUse API cannot be reached', async () => {
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch.'));

        await expect(hasReportedAppError(new AppError('Offline.', 'test'))).resolves.toBe(false);
    });
});
