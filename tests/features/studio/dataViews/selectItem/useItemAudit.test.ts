// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

// ── DPUse Framework
import type { ContentAuditConfig, DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { raiseAppFailure } from '@/state/errors';
import { useItemAudit } from '@/features/studio/dataViews/selectItem/useItemAudit';
import { abortDataViewContentAudit, auditDataViewContent, stopDataViewContentAudit } from '@/features/studio/dataViews/_dataViews';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));
vi.mock('@/state/errors', async (importOriginal) => ({ ...(await importOriginal<object>()), raiseAppFailure: vi.fn() }));
vi.mock('@/features/studio/dataViews/_dataViews', () => ({ abortDataViewContentAudit: vi.fn(), auditDataViewContent: vi.fn(), stopDataViewContentAudit: vi.fn() }));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_VIEW = { connectionId: 'source1' } as DataViewConfig;
const AUDIT = { recordCount: 2 } as ContentAuditConfig;

function renderNothing(): ReturnType<typeof h> {
    return h('div');
}

function mountAudit(
    handleAudited = vi.fn().mockResolvedValue(null),
    dataViewConfig: DataViewConfig | null = DATA_VIEW
): {
    audit: ReturnType<typeof useItemAudit>;
    unmount: () => void;
} {
    let audit: ReturnType<typeof useItemAudit> | undefined;
    const wrapper = mount(
        defineComponent({
            setup() {
                audit = useItemAudit(() => dataViewConfig ?? undefined, handleAudited);
                return renderNothing;
            }
        })
    );
    return {
        audit: assertDefined(audit),
        unmount: (): void => {
            wrapper.unmount();
        }
    };
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

afterEach(() => {
    vi.clearAllMocks();
});

describe('useItemAudit', () => {
    it('audits the data view as the user has it, reports progress, and hands over the result', async () => {
        vi.mocked(auditDataViewContent).mockImplementationOnce((_config, _byteLimit, onProgress) => {
            onProgress(5, 1000);
            return Promise.resolve(AUDIT);
        });
        const handleAudited = vi.fn().mockResolvedValue(null);
        const { audit } = mountAudit(handleAudited);

        await audit.startAudit(2048);

        expect(auditDataViewContent).toHaveBeenCalledWith(DATA_VIEW, 2048, expect.any(Function));
        expect(audit.auditedByteCount.value).toBe(1000);
        expect(audit.auditedRecordCount.value).toBe(5);
        expect(audit.auditIsRunning.value).toBe(false);
        expect(handleAudited).toHaveBeenCalledWith(AUDIT);
    });

    it('does nothing with no item to audit', async () => {
        const { audit } = mountAudit(vi.fn(), null);

        await audit.startAudit(undefined);

        expect(auditDataViewContent).not.toHaveBeenCalled();
    });

    it('announces a failed audit', async () => {
        vi.mocked(auditDataViewContent).mockRejectedValueOnce(new Error('Source failed.'));
        const { audit } = mountAudit();

        await audit.startAudit(undefined);

        expect(raiseAppFailure).toHaveBeenCalledOnce();
        expect(audit.auditIsRunning.value).toBe(false);
    });

    it('keeps what a stopped audit read', async () => {
        vi.mocked(stopDataViewContentAudit).mockResolvedValue();
        vi.mocked(auditDataViewContent).mockResolvedValueOnce(AUDIT);
        const handleAudited = vi.fn();
        const { audit } = mountAudit(handleAudited);

        const started = audit.startAudit(undefined);
        audit.stopAudit();
        await started;

        expect(stopDataViewContentAudit).toHaveBeenCalledWith('source1');
        expect(abortDataViewContentAudit).not.toHaveBeenCalled();
        expect(handleAudited).toHaveBeenCalledWith(AUDIT);
    });

    it('treats an aborted audit as neither a result nor a failure', async () => {
        vi.mocked(abortDataViewContentAudit).mockResolvedValue();
        vi.mocked(auditDataViewContent).mockRejectedValueOnce(new Error('Aborted.'));
        const handleAudited = vi.fn();
        const { audit } = mountAudit(handleAudited);

        const started = audit.startAudit(undefined);
        audit.abortAudit();
        await started;

        expect(abortDataViewContentAudit).toHaveBeenCalledWith('source1');
        expect(raiseAppFailure).not.toHaveBeenCalled();
        expect(handleAudited).not.toHaveBeenCalled();
    });

    it('aborts a running audit on leaving', () => {
        vi.mocked(abortDataViewContentAudit).mockResolvedValue();
        vi.mocked(auditDataViewContent).mockReturnValueOnce(new Promise(() => null));
        const { audit, unmount } = mountAudit();

        void audit.startAudit(undefined);
        unmount();

        expect(abortDataViewContentAudit).toHaveBeenCalledWith('source1');
    });
});
