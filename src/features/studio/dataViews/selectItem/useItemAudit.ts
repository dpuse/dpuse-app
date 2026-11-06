// ── External Dependencies & Registrations
import { useIntervalFn } from '@vueuse/core';
import { onBeforeUnmount, type Ref, ref } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { AuditObjectContentResult, DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { raiseAppFailure } from '@/state/errors';
import { abortDataViewContentAudit, auditDataViewContent, stopDataViewContentAudit } from '@/features/studio/dataViews/_dataViews';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface ItemAudit {
    abortAudit: () => void;
    auditedByteCount: Ref<number>;
    auditedRecordCount: Ref<number>;
    auditElapsedDuration: Ref<number>;
    auditIsRunning: Ref<boolean>;
    startAudit: (byteLimit: number | undefined) => Promise<void>;
    stopAudit: () => void;
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Runs an audit of the item on screen, from its start to 'byteLimit' or its end. The caller gives the data view as the user
// has it, so an item not yet saved can be audited, and decides where the result goes. Stopping keeps what was read so far.
// Leaving aborts the audit and drops its result, rather than letting it run on unseen. 'areHeadersChosen' says whether the
// user chose if there is a header, so the audit only checks again for one that was detected as absent.
export function useItemAudit(
    constructDataViewConfig: () => DataViewConfig | undefined,
    handleAudited: (auditResult: AuditObjectContentResult) => void,
    areHeadersChosen: () => boolean
): ItemAudit {
    const auditIsRunning = ref(false);
    const auditIsAborted = ref(false);
    const auditedByteCount = ref(0);
    const auditedRecordCount = ref(0);
    const auditElapsedDuration = ref(0);
    const auditStartedAt = ref(0);
    const auditedConnectionId = ref<string>();
    const wasAuditAborted = (): boolean => auditIsAborted.value; // Read through a function, because 'abortAudit' sets it while the audit is awaited.

    async function startAudit(byteLimit: number | undefined): Promise<void> {
        const dataViewConfig = constructDataViewConfig();
        if (dataViewConfig == null || auditIsRunning.value) return;

        auditIsRunning.value = true;
        auditIsAborted.value = false;
        auditedByteCount.value = 0;
        auditedRecordCount.value = 0;
        auditElapsedDuration.value = 0;
        auditStartedAt.value = Date.now();
        auditedConnectionId.value = dataViewConfig.connectionId;
        try {
            const auditResult = await auditDataViewContent(
                dataViewConfig,
                byteLimit,
                (recordCount, byteCount) => {
                    auditedByteCount.value = byteCount;
                    auditedRecordCount.value = recordCount;
                },
                areHeadersChosen()
            );
            if (!wasAuditAborted()) handleAudited(auditResult);
        } catch (error) {
            if (wasAuditAborted()) return;
            raiseAppFailure(new AppError('Failed to audit this item.', 'dpuse-app.useItemAudit.startAudit', { typeId: 'handled' }, { cause: error }));
        } finally {
            auditIsRunning.value = false;
        }
    }

    function stopAudit(): void {
        if (!auditIsRunning.value || auditedConnectionId.value == null) return;
        void stopDataViewContentAudit(auditedConnectionId.value).catch((error: unknown) => {
            raiseAppFailure(new AppError('Failed to stop the audit.', 'dpuse-app.useItemAudit.stopAudit', { typeId: 'handled' }, { cause: error }));
        });
    }

    function abortAudit(): void {
        if (!auditIsRunning.value || auditedConnectionId.value == null) return;
        auditIsAborted.value = true;
        void abortDataViewContentAudit(auditedConnectionId.value).catch((error: unknown) => {
            raiseAppFailure(new AppError('Failed to abort the audit.', 'dpuse-app.useItemAudit.abortAudit', { typeId: 'handled' }, { cause: error }));
        });
    }

    useIntervalFn(() => {
        if (auditIsRunning.value) auditElapsedDuration.value = Date.now() - auditStartedAt.value;
    }, 500);

    onBeforeUnmount(abortAudit);

    return { abortAudit, auditedByteCount, auditedRecordCount, auditElapsedDuration, auditIsRunning, startAudit, stopAudit };
}
