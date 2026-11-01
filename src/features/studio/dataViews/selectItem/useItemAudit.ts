// ── External Dependencies & Registrations
import { onBeforeUnmount, type Ref, ref } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { ContentAuditConfig, DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { raiseAppFailure } from '@/state/errors';
import { abortDataViewContentAudit, auditDataViewContent } from '@/features/studio/dataViews/_dataViews';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Runs an audit of the item on screen, which reads the whole item. The caller gives the data view as the user has it, so
// an item not yet saved can be audited, and decides where the result goes. Stopping is not a failure, and leaving stops
// the audit rather than letting it run on unseen.
export function useItemAudit(
    constructDataViewConfig: () => DataViewConfig | undefined,
    handleAudited: (dataViewConfig: DataViewConfig, contentAuditConfig: ContentAuditConfig) => Promise<void>
): { auditedRecordCount: Ref<number>; auditIsRunning: Ref<boolean>; startAudit: () => Promise<void>; stopAudit: () => void } {
    const auditIsRunning = ref(false);
    const auditIsStopped = ref(false);
    const auditedRecordCount = ref(0);
    const auditedConnectionId = ref<string>();
    const wasAuditStopped = (): boolean => auditIsStopped.value; // Read through a function, because 'stopAudit' sets it while the audit is awaited.

    async function startAudit(): Promise<void> {
        const dataViewConfig = constructDataViewConfig();
        if (dataViewConfig == null || auditIsRunning.value) return;

        auditIsRunning.value = true;
        auditIsStopped.value = false;
        auditedRecordCount.value = 0;
        auditedConnectionId.value = dataViewConfig.connectionId;
        try {
            const contentAuditConfig = await auditDataViewContent(dataViewConfig, (recordCount) => {
                auditedRecordCount.value = recordCount;
            });
            if (!wasAuditStopped()) await handleAudited(dataViewConfig, contentAuditConfig);
        } catch (error) {
            if (wasAuditStopped()) return;
            raiseAppFailure(new AppError('Failed to audit this item.', 'dpuse-app.useItemAudit.startAudit', { typeId: 'handled' }, { cause: error }));
        } finally {
            auditIsRunning.value = false;
        }
    }

    function stopAudit(): void {
        if (!auditIsRunning.value || auditedConnectionId.value == null) return;
        auditIsStopped.value = true;
        void abortDataViewContentAudit(auditedConnectionId.value).catch((error: unknown) => {
            raiseAppFailure(new AppError('Failed to stop the audit.', 'dpuse-app.useItemAudit.stopAudit', { typeId: 'handled' }, { cause: error }));
        });
    }

    onBeforeUnmount(stopAudit);

    return { auditedRecordCount, auditIsRunning, startAudit, stopAudit };
}
