<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { useConfirmDialog } from '@vueuse/core';
import { CircleXIcon, SaveIcon } from '@lucide/vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { dataViewRecordsAreLoading } from '@/features/studio/dataViews/_state/dataViewStore';
import { ignoreReportedNavigationFailure } from '@/router';
import { PILL_CLASSES } from '@/components/ui/action/action';
import { raiseAppFailure } from '@/state/errors';
import { t } from '@/state/locale';
import { TEXT } from './DataViewActions_.json';
import { completeDataViewDraft, dataViewCanBeSaved, dataViewHasChanges, discardDataViewDraft } from '@/features/studio/dataViews/_state/dataViewDraft';
import { DATA_VIEW_ADD_ACTION_ID, DATA_VIEW_SCROLL_ACTIONS_ID, DATA_VIEW_STEP_ACTION_ID } from '@/features/studio/dataViews/_state/dataViews';
import { dataViewActionLabelsAreHidden, useUpdateDataView } from '@/features/studio/dataViews/_state/dataViews';

// ── Static Components
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import PillSegment from '@/components/ui/action/PillSegment.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { dataViewConfig, dataViewIsNew } = defineProps<{
    dataViewConfig: DataViewConfig | undefined; // As the user has it, with any unsaved changes.
    dataViewIsNew: boolean; // Being added, so not saved yet.
}>();

const emit = defineEmits<{ discarded: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const { isPending: dataViewIsSaving, mutateAsync: saveDataView } = useUpdateDataView();
const { cancel: cancelDiscard, confirm: confirmDiscard, isRevealed: discardConfirmIsOpen, reveal: revealDiscardConfirm } = useConfirmDialog();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Discard ─ Waits while records load, because the load records its table under the data view as it was when the load
// started. Why it is dimmed shows as its tooltip.
const discardIsDisabled = computed(() => !dataViewHasChanges.value || dataViewRecordsAreLoading.value);
const discardDisabledReason = computed(() => t(TEXT, dataViewRecordsAreLoading.value ? 'discard.loading.text' : 'discard.noChanges.text'));

// ── Save ─ Waits for the records as Discard does. A change of connection or item cannot be saved until an item is open.
const saveIsDisabled = computed(() => !dataViewCanBeSaved.value || dataViewIsSaving.value || dataViewRecordsAreLoading.value);
const saveDisabledReason = computed((): string | undefined => {
    if (dataViewIsSaving.value) return; // Dimmed only while the save runs, which needs no explanation.
    if (dataViewRecordsAreLoading.value) return t(TEXT, 'save.loading.text');
    return t(TEXT, dataViewHasChanges.value ? 'save.noItem.text' : 'save.noChanges.text');
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// The caller decides where a discarded data view goes, because a new one has nothing saved to show.
async function handleDiscardDataView(): Promise<void> {
    if (discardIsDisabled.value) return;

    const { isCanceled } = await revealDiscardConfirm();
    if (isCanceled) return;

    discardDataViewDraft();
    emit('discarded');
}

async function handleSaveDataView(): Promise<void> {
    const draftDataViewConfig = dataViewConfig;
    if (draftDataViewConfig == null || saveIsDisabled.value) return;

    try {
        await saveDataView(draftDataViewConfig);
        if (dataViewIsNew) {
            await ignoreReportedNavigationFailure(router.replace({ params: { dataViewId: draftDataViewConfig.id }, query: route.query })); // It has a real id now, so a reload can restore it.
        }
        completeDataViewDraft();
    } catch (error) {
        // Announced rather than shown in the task: the draft is untouched, so nothing is lost by trying again.
        raiseAppFailure(new AppError('Failed to save data view.', 'dpuse-app.DataViewActions.handleSaveDataView', { data: { typeId: 'handled' }, cause: error }));
    }
}
</script>

<template>
    <!-- 'contents' keeps the dialog out of the row of actions, whose 'pointer-events-none' it would otherwise inherit. -->
    <div class="contents">
        <!-- Actions ─ One row along the bottom on every step: one pill, then any control of the step's own. The pill
             holds the step's scroll buttons, its add action, Discard, Save and the step's own action, which the steps
             place with 'Teleport'. Segments that come and go grow and shrink, so the pill widens and narrows around
             them. Labels depend on the pane's width, not the screen's, because the splitter resizes the pane. -->
        <div
            class="@container pointer-events-none absolute inset-x-0 bottom-(--safe-bottom-offset) z-10 flex items-center justify-end gap-x-2 pr-6"
            data-region="DataViewActions"
        >
            <!-- '-ml-px' moves the first segment's dividing line under the pill's border, whichever segment is first. -->
            <div :aria-label="t(TEXT, 'actions.aria')" class="pointer-events-auto h-10 overflow-hidden shadow-md" :class="PILL_CLASSES" data-region="DataViewPill" role="group">
                <div class="-ml-px flex h-full">
                    <div :id="DATA_VIEW_SCROLL_ACTIONS_ID" class="contents" />
                    <div :id="DATA_VIEW_ADD_ACTION_ID" class="contents" />
                    <PillSegment
                        :disabled="discardIsDisabled"
                        :disabled-reason="discardDisabledReason"
                        :icon="CircleXIcon"
                        :is-label-hidden="dataViewActionLabelsAreHidden"
                        :label="t(TEXT, 'discard.label')"
                        @click="handleDiscardDataView"
                    />
                    <PillSegment
                        :disabled="saveIsDisabled"
                        :disabled-reason="saveDisabledReason"
                        :icon="SaveIcon"
                        :is-label-hidden="dataViewActionLabelsAreHidden"
                        :label="t(TEXT, 'save.label')"
                        @click="handleSaveDataView"
                    />
                    <div :id="DATA_VIEW_STEP_ACTION_ID" class="contents" />
                </div>
            </div>
        </div>

        <ConfirmDialog
            :confirm-label="t(TEXT, 'discard.label')"
            :is-open="discardConfirmIsOpen"
            :message="t(TEXT, dataViewIsNew ? 'discard.new.text' : 'discard.text')"
            :title="t(TEXT, 'discard.title')"
            @cancel="cancelDiscard"
            @confirm="confirmDiscard"
        />
    </div>
</template>
