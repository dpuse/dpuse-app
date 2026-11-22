<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useConfirmDialog, useTimeoutFn } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, localiseConfigs } from '@dpuse/dpuse-shared';
import type { EventQueryConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { defineLazyComponent } from '@/utilities/index.ts';
import { ignoreReportedNavigationFailure } from '@/router';
import { raiseAppFailure } from '@/state/errors';
import { TEXT } from './EventQueryList_.json';
import { useCardRowHeight } from '@/components/ui/config/configCard';
import { useQueryFailure } from '@/services/queryClient';
import { cancelEventQueryRetrieval, useDeleteEventQuery, useEventQueries } from './_eventQueries';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import EventQueryPanel from './EventQueryPanel.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioListLayout from '@/features/studio/_components/StudioListLayout.vue';

// ── Dynamic Components
const EmptyPlaceholder = defineLazyComponent(() => import('@/components/ui/placeholder/EmptyPlaceholder.vue'), 'EmptyPlaceholder');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const SLOW_RETRIEVAL_MS = 2000; // Long enough that a normal load never shows the slow-load message.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Route
const route = useRoute();
const router = useRouter();

// ── Event Queries ─ 'isPending' on the delete stops a second click starting a second one while the first is under way.
const {
    data: eventQueryConfigs,
    error: eventQueryRetrievalError,
    isError: eventQueryRetrievalFailed,
    isFetching: eventQueryIsRetrieving,
    isSuccess: eventQueryRetrievalSucceeded,
    refetch: refetchEventQueries
} = useEventQueries();
const { isPending: eventQueryIsDeleting, mutateAsync: deleteEventQuery } = useDeleteEventQuery();

// ── Slow Retrieval ─ A load that takes a while says so and offers Cancel and Retry, so a stuck read never leaves the
// user watching a busy bar with no way out.
const eventQueryRetrievalIsCancelled = ref(false);
const eventQueryRetrievalIsSlow = ref(false);
const { start: startSlowRetrievalTimer, stop: stopSlowRetrievalTimer } = useTimeoutFn(
    () => {
        eventQueryRetrievalIsSlow.value = true;
    },
    SLOW_RETRIEVAL_MS,
    { immediate: false }
);

// ── Delete Confirmation
const { cancel: cancelDelete, confirm: confirmDelete, isRevealed: deleteConfirmIsOpen, reveal: revealDeleteConfirm } = useConfirmDialog();
const deletingEventQueryLocalisedConfig = shallowRef<LocalisedConfig<EventQueryConfig>>(); // Kept after the dialog closes, so its text does not blank while it fades out.
const deletedEventQueryLabel = ref<string>(); // Named in the message read out once a delete finishes.
const deleteStatusElement = useTemplateRef<HTMLParagraphElement>('deleteStatus');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Event Queries
const eventQueryLocalisedConfigs = computed((): LocalisedConfig<EventQueryConfig>[] => localiseConfigs<EventQueryConfig>(eventQueryConfigs.value ?? [], localeId.value));
const eventQueryRetrievalFailure = useQueryFailure(eventQueryRetrievalError);

// ── Delete Status
const deleteStatusText = computed(() => (deletedEventQueryLabel.value == null ? '' : t(TEXT, 'delete.done.text', { name: deletedEventQueryLabel.value })));

// ── Retrieval ─ A load under way with nothing to show yet. A cancelled load stays cancelled until another one starts.
const eventQueryRetrievalIsPending = computed(() => eventQueryIsRetrieving.value && eventQueryConfigs.value == null);
const eventQueryRetrievalShowsSlow = computed(() => eventQueryRetrievalIsPending.value && eventQueryRetrievalIsSlow.value);
const eventQueryRetrievalShowsCancelled = computed(() => eventQueryRetrievalIsCancelled.value && !eventQueryIsRetrieving.value && eventQueryConfigs.value == null);

// ── Selection ─ The URL is the one source of the selection, so reload, deep links and back/forward all land on the
// same card. It is matched again whenever the list arrives or is rebuilt, which also drops a selection whose event
// query has gone.
const selectedEventQueryLocalisedConfig = computed(() => eventQueryLocalisedConfigs.value.find((config) => config.id === route.params.eventQueryId));

// ── Grid ─ 'rowCount' stays undefined, which keeps the grid busy, until retrieval settles either way; 0 means
// confirmed empty.
const eventQueryDataSource = computed((): DataSource<LocalisedConfig<EventQueryConfig>> => ({
    rowCount: eventQueryRetrievalSucceeded.value || eventQueryRetrievalFailed.value ? eventQueryLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<EventQueryConfig>[] }> => Promise.resolve({ rows: eventQueryLocalisedConfigs.value.slice(start, end) })
}));

// Cards here have no actions or details yet, so they are one row high.
const cardRowHeight = useCardRowHeight(false);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Each load starts its own wait for the slow-load message, so one that finishes quickly never shows it.
watch(
    eventQueryRetrievalIsPending,
    (isPending) => {
        eventQueryRetrievalIsSlow.value = false;
        if (isPending) startSlowRetrievalTimer();
        else stopSlowRetrievalTimer();
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Starts a fresh load, cancelling any still under way. The slow-load wait restarts here too, because a load replaced
// mid-way may never stop being pending.
function handleRetryRetrieval(): void {
    eventQueryRetrievalIsCancelled.value = false;
    eventQueryRetrievalIsSlow.value = false;
    startSlowRetrievalTimer();
    void refetchEventQueries();
}

function handleCancelRetrieval(): void {
    eventQueryRetrievalIsCancelled.value = true;
    void cancelEventQueryRetrieval();
}

// Starts at the context diagram, because an event query is made for an event chosen there.
function handleAddEventQuery(): void {
    void ignoreReportedNavigationFailure(router.push({ name: 'eventQueries', query: route.query }));
}

// A card stays selected when tapped again, as in a select. On a narrow screen, coming back to the list hides the
// selected card's detail, so the tap opens it again. Beside the list the detail is already showing, so the tap changes
// nothing.
function handleSelectEventQuery(eventQueryLocalisedConfig: LocalisedConfig<EventQueryConfig>, openDetail: () => void): void {
    if (selectedEventQueryLocalisedConfig.value?.id === eventQueryLocalisedConfig.id) openDetail();
    else updateEventQueryIdParameter(eventQueryLocalisedConfig.id);
}

async function handleDeleteEventQuery(eventQueryLocalisedConfig: LocalisedConfig<EventQueryConfig>): Promise<void> {
    if (eventQueryIsDeleting.value) return;

    deletingEventQueryLocalisedConfig.value = eventQueryLocalisedConfig;
    const { isCanceled } = await revealDeleteConfirm();
    if (isCanceled) return;

    try {
        await deleteEventQuery(eventQueryLocalisedConfig.id);
        if (route.params.eventQueryId === eventQueryLocalisedConfig.id) updateEventQueryIdParameter(); // The URL, not the list, which the delete has already changed.

        // The panel holding the Delete button closes with its event query, which would leave focus nowhere. Focus moves
        // to a message that screen readers read out, and the next Tab carries on into the list.
        deletedEventQueryLabel.value = eventQueryLocalisedConfig.label;
        await nextTick();
        deleteStatusElement.value?.focus();
    } catch (error) {
        // The failure goes to the app-level failure dialog, not the list. The delete did not happen, so the row is
        // still there and still works, and the list has nothing to explain.
        raiseAppFailure(new AppError('Failed to remove event query.', 'dpuse-app.EventQueryList.handleDeleteEventQuery', { data: { typeId: 'handled' }, cause: error }));
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// An explicit 'name' is needed even though this stays on the same route. Without it, an absent 'eventQueryId' keeps the
// one already in the URL instead of clearing it.
function updateEventQueryIdParameter(eventQueryId?: string): void {
    void ignoreReportedNavigationFailure(router.replace({ name: 'eventQueryList', params: { eventQueryId }, query: route.query }));
}
</script>

<template>
    <StudioListLayout>
        <Separator class="flex-none" />

        <!-- Delete Status ─ Hidden from view. It takes focus once a delete finishes, so screen readers say what was
             deleted. -->
        <p ref="deleteStatus" class="sr-only" tabindex="-1">{{ deleteStatusText }}</p>

        <!-- Cancelled Retrieval ─ Replaces the list and detail pane, as a failure does, because a list that never
             loaded has nothing to show. -->
        <div v-if="eventQueryRetrievalShowsCancelled" class="mx-page mt-6 flex flex-col items-start gap-3">
            <p class="text-sm text-muted" role="status">{{ t(TEXT, 'retrieval.cancelled.text') }}</p>
            <RectangleButton @click="handleRetryRetrieval">{{ t(TEXT, 'retrieval.retry.label') }}</RectangleButton>
        </div>

        <!-- Retrieval Failure ─ Replaces the list and detail pane when the event queries could not be retrieved.
             Otherwise the user would see an empty list, and a detail pane asking them to choose from it, with no
             explanation. -->
        <ErrorNotice v-else-if="eventQueryRetrievalFailure" :failures="[eventQueryRetrievalFailure]" @retry="handleRetryRetrieval" />

        <!-- List and Detail Panel -->
        <GridDetailPanel
            v-else
            :selected-item="selectedEventQueryLocalisedConfig"
            :add-label="t(TEXT, 'eventQuery.label')"
            class="min-h-0 flex-1"
            :data-source="eventQueryDataSource"
            max-detail-width="65ch"
            :row-height="cardRowHeight"
            :target-column-width="340"
            @add="handleAddEventQuery"
        >
            <!-- Slow Retrieval ─ Below the list's busy bar. Cancel is the safe choice, so it comes first. -->
            <template #busy>
                <div v-if="eventQueryRetrievalShowsSlow" class="mx-page mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <p class="text-sm text-muted" role="status">{{ t(TEXT, 'retrieval.slow.text') }}</p>
                    <div class="flex gap-2">
                        <RectangleButton @click="handleCancelRetrieval">{{ t(TEXT, 'retrieval.cancel.label') }}</RectangleButton>
                        <RectangleButton @click="handleRetryRetrieval">{{ t(TEXT, 'retrieval.retry.label') }}</RectangleButton>
                    </div>
                </div>
            </template>

            <template #item="{ isSplit, item, openDetail }">
                <!-- 'is-inert' ─ Beside the list, the selected card's detail is already showing, so a click on it does
                     nothing and the card does not look clickable. -->
                <ConfigCard
                    :config="item"
                    hides-icon
                    :is-inert="isSplit && item.id === selectedEventQueryLocalisedConfig?.id"
                    :selected="item.id === selectedEventQueryLocalisedConfig?.id"
                    @click="handleSelectEventQuery(item, openDetail)"
                />
            </template>

            <template #detail="{ item, close }">
                <EventQueryPanel :event-query-localised-config="item" :is-deleting="eventQueryIsDeleting" @close="close" @delete="handleDeleteEventQuery(item)" />
            </template>

            <template #no-items>
                <EmptyPlaceholder
                    :message-item-label="t(TEXT, 'eventQuery.other.text')"
                    :description-item-label="t(TEXT, 'eventQuery.new.text')"
                    :action-item-label="t(TEXT, 'eventQuery.label')"
                    @add="handleAddEventQuery"
                />
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="t(TEXT, 'noSelection.text')" />
            </template>
        </GridDetailPanel>

        <ConfirmDialog
            :confirm-label="t(TEXT, 'delete.confirm.label')"
            :is-open="deleteConfirmIsOpen"
            :message="t(TEXT, 'delete.confirm.text', { name: deletingEventQueryLocalisedConfig?.label ?? '' })"
            :title="t(TEXT, 'delete.confirm.title')"
            @cancel="cancelDelete"
            @confirm="confirmDelete"
        />
    </StudioListLayout>
</template>
