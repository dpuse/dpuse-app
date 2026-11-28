<script setup lang="ts">
// ── External Dependencies & Registrations
import { PlusIcon } from '@lucide/vue';
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useConfirmDialog, useTimeoutFn } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, localiseConfig, localiseConfigs, localiseReference } from '@dpuse/dpuse-shared';
import type { ContextEventReference, ContextModelConfig, EventQueryConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { defineLazyComponent } from '@/utilities/index.ts';
import { localiseText } from '@/state/contextModels';
import { raiseAppFailure } from '@/state/errors';
import { resolveEventQueryDiagramFocus } from './_eventQueryDiagram';
import { TEXT } from './EventQueriesOverview_.json';
import { useQueryFailure } from '@/services/queryClient';
import { useUnsavedWork } from '@/state/unsavedWork';
import { cancelEventQueryRetrieval, constructNewEventQueryConfig, useDeleteEventQuery, useEventQueries, useUpdateEventQuery } from './_eventQueries';
import { constructContextDiagramRoute, readContextDiagramFocus, useContextDiagramFocus } from './_contextDiagramFocus';
import type { ContextAreaConfig, ContextEntityConfig, ContextEventConfig, ContextModelReferenceConfig } from './_contextDiagramFocus';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import ContextPartDetail from './ContextPartDetail.vue';
import Dialog from '@/components/ui/dialog/Dialog.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import EventQueryPanel from './EventQueryPanel.vue';
import MasterDetailPanel from '@/components/ui/MasterDetailPanel.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import RouterViewTransition from '@/components/ui/RouterViewTransition.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import StudioListLayout from '@/features/studio/_components/StudioListLayout.vue';

// ── Dynamic Components
const StudioDescriptorsPanel = defineLazyComponent(() => import('@/features/studio/_components/StudioDescriptorsPanel.vue'), 'StudioDescriptorsPanel');

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// What the detail panel shows. The id carries the kind, so a part of the context and an event query can never share one.
type DetailItem =
    { id: string; typeId: 'contextPart'; contextPart: ContextPart } | { id: string; typeId: 'eventQuery'; eventQueryLocalisedConfig: LocalisedConfig<EventQueryConfig> };

// The area, model, entity or event the diagram is drilled down to, with the parts above it. The deepest one given is the
// part shown.
interface ContextPart {
    areaConfig: ContextAreaConfig;
    modelReferenceConfig?: ContextModelReferenceConfig | undefined;
    modelConfig?: ContextModelConfig | null | undefined;
    entityConfig?: ContextEntityConfig | undefined;
    eventConfig?: ContextEventConfig | undefined;
}

// The event a new event query is for, with the names it is first called after.
interface NewEventQueryEvent {
    contextEventReference: ContextEventReference;
    entityLabel: string;
    eventLabel: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const SLOW_RETRIEVAL_MS = 2000; // Long enough that a normal load never shows the slow-load message.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Route
const route = useRoute();
const router = useRouter();

// ── Event Queries ─ 'isPending' on each change stops a second click starting a second one while the first is saving.
const {
    data: eventQueryConfigs,
    error: eventQueryRetrievalError,
    isError: eventQueryRetrievalFailed,
    isFetching: eventQueryIsRetrieving,
    isSuccess: eventQueryRetrievalSucceeded,
    refetch: refetchEventQueries
} = useEventQueries();
const { isPending: eventQueryIsDeleting, mutateAsync: deleteEventQuery } = useDeleteEventQuery();
const { isPending: eventQueryIsAdding, mutateAsync: addEventQuery } = useUpdateEventQuery();

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

// ── New Event Query ─ Only stored by the dialog's Save, so its ✕ leaves nothing behind.
const newEventQueryEvent = shallowRef<NewEventQueryEvent>(); // The event the dialog is open for.
const newEventQueryDialogIsOpen = ref(false);
const draftDescription = ref('');
const draftLabel = ref('');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Views ─ Two ways round the same event queries: a diagram of the context they are made for, or the list. Each is a
// route of its own, shown in this panel's 'RouterView', and they share the one detail panel. The selected event query
// stays selected across a switch, because both routes carry its id.
const currentViewId = computed(() => (route.name === 'eventQueryList' ? 'list' : 'diagram'));
const viewIsLoading = computed(() => navigationPendingDepth.value === 2); // The overview's own 'RouterView' is two levels in, so the overview shows the spinner while a view loads.

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
// same event query. It is matched again whenever the list arrives or is rebuilt, which also drops a selection whose
// event query has gone.
const selectedEventQueryLocalisedConfig = computed(() => eventQueryLocalisedConfigs.value.find((config) => config.id === route.params.eventQueryId));

// ── Detail ─ What the one detail panel shows: the selected event query, or else, in the diagram, the area, model,
// entity or event it has been drilled down to. The list selects only event queries.
const { focusedAreaConfig, focusedEntityConfig, focusedEventConfig, focusedModelConfig, focusedModelIsLoading, focusedModelReferenceConfig } = useContextDiagramFocus();
const selectedDetailItem = computed((): DetailItem | undefined => {
    const eventQueryLocalisedConfig = selectedEventQueryLocalisedConfig.value;
    if (eventQueryLocalisedConfig) return { id: `eventQuery.${eventQueryLocalisedConfig.id}`, typeId: 'eventQuery', eventQueryLocalisedConfig };
    const areaConfig = focusedAreaConfig.value;
    if (areaConfig == null || currentViewId.value !== 'diagram') return undefined;

    const contextPart: ContextPart = {
        areaConfig,
        modelReferenceConfig: focusedModelReferenceConfig.value,
        modelConfig: focusedModelConfig.value,
        entityConfig: focusedEntityConfig.value,
        eventConfig: focusedEventConfig.value
    };
    const id = ['contextPart', areaConfig.id, contextPart.modelReferenceConfig?.id, contextPart.entityConfig?.id, contextPart.eventConfig?.id]
        .filter((part) => part != null)
        .join('.');
    return { id, typeId: 'contextPart', contextPart };
});
// What the summary over the foot of the list or diagram says on a narrow screen: the kind of thing selected, and its name. The
// part of the context named is the deepest one the diagram is drilled down to.
const selectedDetailSummary = computed((): { kindLabel: string; label: string } | undefined => {
    const item = selectedDetailItem.value;
    if (item == null) return undefined;
    if (item.typeId === 'eventQuery') return { kindLabel: t(TEXT, 'eventQuery.label'), label: item.eventQueryLocalisedConfig.label };

    const { areaConfig, entityConfig, eventConfig, modelReferenceConfig } = item.contextPart;
    if (entityConfig && eventConfig) return { kindLabel: t(TEXT, 'event.label'), label: localiseText(eventConfig.labelAction, localeId.value) };
    if (entityConfig) return { kindLabel: t(TEXT, 'entity.label'), label: localiseText(entityConfig.label, localeId.value) };
    if (modelReferenceConfig) return { kindLabel: t(TEXT, 'model.label'), label: localiseReference(modelReferenceConfig, localeId.value).label };
    return { kindLabel: t(TEXT, 'area.label'), label: localiseConfig(areaConfig, localeId.value).label };
});

// ── Focused Event ─ The event the diagram is drilled down to, which takes a new event query, and the event queries
// saved for it, which its detail lists.
const focusedContextEventReference = computed((): ContextEventReference | undefined => {
    const [areaId, modelId, entityId, eventId] = [focusedAreaConfig.value?.id, focusedModelReferenceConfig.value?.id, focusedEntityConfig.value?.id, focusedEventConfig.value?.id];
    return areaId == null || modelId == null || entityId == null || eventId == null ? undefined : { areaId, modelId, entityId, eventId };
});
const focusedEventQueryLocalisedConfigs = computed(() => {
    const focusedReference = focusedContextEventReference.value;
    if (focusedReference == null) return [];
    return eventQueryLocalisedConfigs.value.filter((config) => {
        const reference = config.contextEventReference;
        return (
            reference.areaId === focusedReference.areaId &&
            reference.modelId === focusedReference.modelId &&
            reference.entityId === focusedReference.entityId &&
            reference.eventId === focusedReference.eventId
        );
    });
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useUnsavedWork(newEventQueryDialogIsOpen); // A reload while the dialog is open loses what was typed.

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

// From the list, an event query starts at the context diagram, because it is made for an event chosen there.
function handleAddEventQuery(): void {
    void ignoreReportedNavigationFailure(router.push({ name: 'eventQueryDiagram', query: route.query }));
}

// From the diagram's add node or the event's detail, the new event query is named and described before it is saved.
function handleAddEventQueryForEvent(contextEventReference: ContextEventReference): void {
    const entityConfig = focusedEntityConfig.value;
    const eventConfig = entityConfig?.events.find((config) => config.id === contextEventReference.eventId);
    const entityLabel = entityConfig ? localiseText(entityConfig.label, localeId.value) : '';
    const eventLabel = eventConfig ? localiseText(eventConfig.labelAction, localeId.value) : '';
    newEventQueryEvent.value = { contextEventReference, entityLabel, eventLabel };
    draftDescription.value = '';
    draftLabel.value = t(TEXT, 'newEventQuery.name.text', { entity: entityLabel, event: eventLabel });
    newEventQueryDialogIsOpen.value = true;
}

// A card stays selected when tapped again, as in a select. On a narrow screen the selected card's summary can be
// closed, so the tap shows it again. Beside the list the detail is already showing, so the tap changes nothing.
function handleSelectEventQuery(eventQueryLocalisedConfig: LocalisedConfig<EventQueryConfig>, openDetail: () => void): void {
    if (selectedEventQueryLocalisedConfig.value?.id === eventQueryLocalisedConfig.id) openDetail();
    else updateEventQueryIdParameter(eventQueryLocalisedConfig.id);
}

function handleCloseNewEventQueryDialog(): void {
    newEventQueryDialogIsOpen.value = false;
}

// The new event query is selected once it is saved, so the user sees where it went.
async function handleSaveNewEventQuery(): Promise<void> {
    const contextEventReference = newEventQueryEvent.value?.contextEventReference;
    if (contextEventReference == null || eventQueryIsAdding.value) return;

    newEventQueryDialogIsOpen.value = false;
    try {
        const eventQueryConfig = await addEventQuery(constructNewEventQueryConfig(contextEventReference, localeId.value, draftLabel.value.trim(), draftDescription.value));
        updateEventQueryIdParameter(eventQueryConfig.id); // The save has already put it in the list.
    } catch (error) {
        // Announced rather than shown in the diagram, which is still correct.
        raiseAppFailure(new AppError('Failed to save event query.', 'dpuse-app.EventQueriesOverview.handleSaveNewEventQuery', { data: { typeId: 'handled' }, cause: error }));
    }
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
        // The failure goes to the app-level failure dialog, not the list. The delete did not happen, so the event query
        // is still there and still works, and the view has nothing to explain.
        raiseAppFailure(new AppError('Failed to remove event query.', 'dpuse-app.EventQueriesOverview.handleDeleteEventQuery', { data: { typeId: 'handled' }, cause: error }));
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The route is built in full even though this stays in the same view. Without a 'name', an absent 'eventQueryId' keeps
// the one already in the URL instead of clearing it. In the diagram, an event query is shown under its event, and with
// none the diagram stays at the level it shows.
function updateEventQueryIdParameter(eventQueryId?: string): void {
    if (currentViewId.value === 'list') {
        void ignoreReportedNavigationFailure(router.replace({ name: 'eventQueryList', params: { eventQueryId }, query: route.query }));
        return;
    }
    const eventQuery = eventQueryLocalisedConfigs.value.find((config) => config.id === eventQueryId);
    const focus = resolveEventQueryDiagramFocus(readContextDiagramFocus(route.params), eventQuery);
    void ignoreReportedNavigationFailure(router.replace(constructContextDiagramRoute(focus, route.query, eventQueryId)));
}
</script>

<template>
    <StudioListLayout>
        <!-- Delete Status ─ Hidden from view. It takes focus once a delete finishes, so screen readers say what was
             deleted. -->
        <p ref="deleteStatus" class="sr-only" tabindex="-1">{{ deleteStatusText }}</p>

        <!-- Cancelled Retrieval ─ Replaces both views and the detail pane, as a failure does, because event queries that
             never loaded leave nothing to show. -->
        <div v-if="eventQueryRetrievalShowsCancelled" class="mx-page mt-6 flex flex-col items-start gap-3">
            <p class="text-sm text-muted" role="status">{{ t(TEXT, 'retrieval.cancelled.text') }}</p>
            <RectangleButton @click="handleRetryRetrieval">{{ t(TEXT, 'retrieval.retry.label') }}</RectangleButton>
        </div>

        <!-- Retrieval Failure ─ Replaces both views and the detail pane when the event queries could not be retrieved.
             Otherwise the user would see an empty list, and a detail pane asking them to choose from it, with no
             explanation. -->
        <ErrorNotice v-else-if="eventQueryRetrievalFailure" :failures="[eventQueryRetrievalFailure]" @retry="handleRetryRetrieval" />

        <!-- Views and Detail Panel ─ The list and the diagram take turns in the left pane, and the one detail panel
             beside them serves both, so it stays as it is when the view changes. -->
        <MasterDetailPanel v-else class="min-h-0 flex-1" max-detail-width="65ch" :selected-item="selectedDetailItem">
            <template #master="{ isSplit, openDetail }">
                <!-- The list and the diagram take different props and events, so each is rendered by itself. -->
                <RouterViewTransition v-slot="{ component }" class="min-h-0 flex-1" :is-loading="viewIsLoading">
                    <component
                        :is="component"
                        v-if="currentViewId === 'list'"
                        key="list"
                        :event-query-localised-configs="eventQueryLocalisedConfigs"
                        :is-split="isSplit"
                        :retrieval-is-settled="eventQueryRetrievalSucceeded || eventQueryRetrievalFailed"
                        :retrieval-is-slow="eventQueryRetrievalShowsSlow"
                        :selected-event-query-id="selectedEventQueryLocalisedConfig?.id"
                        @add="handleAddEventQuery"
                        @cancel-retrieval="handleCancelRetrieval"
                        @retry-retrieval="handleRetryRetrieval"
                        @select="handleSelectEventQuery($event, openDetail)"
                    />
                    <component
                        :is="component"
                        v-else
                        key="diagram"
                        :event-query-localised-configs="eventQueryLocalisedConfigs"
                        :selected-event-query-id="selectedEventQueryLocalisedConfig?.id"
                        @add="handleAddEventQueryForEvent"
                        @select="updateEventQueryIdParameter"
                    />
                </RouterViewTransition>
            </template>

            <!-- Detail ─ An event query has the panel it has always had. A part of the context has a read-only panel,
                 because the context is changed in Setup. -->
            <template #detail="{ item, close }">
                <EventQueryPanel
                    v-if="item.typeId === 'eventQuery'"
                    :event-query-localised-config="item.eventQueryLocalisedConfig"
                    :is-deleting="eventQueryIsDeleting"
                    @close="close"
                    @delete="handleDeleteEventQuery(item.eventQueryLocalisedConfig)"
                />
                <ContextPartDetail
                    v-else
                    :area-config="item.contextPart.areaConfig"
                    :entity-config="item.contextPart.entityConfig"
                    :event-config="item.contextPart.eventConfig"
                    :event-query-localised-configs="focusedEventQueryLocalisedConfigs"
                    :model-config="item.contextPart.modelConfig"
                    :model-is-loading="focusedModelIsLoading"
                    :model-reference-config="item.contextPart.modelReferenceConfig"
                    @close="close"
                />
            </template>

            <!-- Detail Summary ─ On a narrow screen the list or diagram stays, and the detail is a sheet over its foot that
                 shows this at its lowest, so a diagram can be drilled down without each click covering it. -->
            <template #detail-summary>
                <p class="truncate text-sm text-muted">{{ selectedDetailSummary?.kindLabel }}</p>
                <p class="truncate font-medium text-emphasis">{{ selectedDetailSummary?.label }}</p>
            </template>

            <!-- Detail Action ─ What the selected thing is for: an event takes a new event query. -->
            <template #detail-action="{ item }">
                <PillButton
                    v-if="item.typeId === 'contextPart' && focusedContextEventReference"
                    :icon="PlusIcon"
                    :label="t(TEXT, 'detail.add.label')"
                    @click="handleAddEventQueryForEvent(focusedContextEventReference)"
                />
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="t(TEXT, currentViewId === 'diagram' ? 'noSelection.diagram.text' : 'noSelection.text')" />
            </template>
        </MasterDetailPanel>

        <ConfirmDialog
            :confirm-label="t(TEXT, 'delete.confirm.label')"
            :is-open="deleteConfirmIsOpen"
            :message="t(TEXT, 'delete.confirm.text', { name: deletingEventQueryLocalisedConfig?.label ?? '' })"
            :title="t(TEXT, 'delete.confirm.title')"
            @cancel="cancelDelete"
            @confirm="confirmDelete"
        />

        <Dialog
            :is-open="newEventQueryDialogIsOpen"
            max-width="90vw"
            min-height="90vh"
            sizing="full"
            :title="t(TEXT, 'newEventQuery.title')"
            @close="handleCloseNewEventQueryDialog"
        >
            <StudioDescriptorsPanel v-model:label="draftLabel" v-model:description="draftDescription" />
            <div class="flex flex-none justify-end p-4">
                <RectangleButton :disabled="eventQueryIsAdding" variant="primary" @click="handleSaveNewEventQuery">{{ t(TEXT, 'newEventQuery.save.label') }}</RectangleButton>
            </div>
        </Dialog>
    </StudioListLayout>
</template>
