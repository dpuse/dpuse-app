<script setup lang="ts">
// ── External Dependencies & Registrations
import { SquarePenIcon } from '@lucide/vue';
import { computed, ref, shallowRef } from 'vue';

// ── DPUse Framework
import { AppError, localiseConfig, localiseReference } from '@dpuse/dpuse-shared';
import type { EventQueryConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { contextConfig } from '@/state/configs';
import { defineLazyComponent } from '@/utilities/index.ts';
import { raiseAppFailure } from '@/state/errors';
import { renderMarkdown } from '@/services/useMarkedTool';
import { TEXT } from './EventQueryPanel_.json';
import { useUnsavedWork } from '@/state/unsavedWork';
import { localeId, t } from '@/state/locale';
import { localiseText, useContextModel } from '@/state/contextModels';
import { useEventQuery, useUpdateEventQuery } from './_eventQueries';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import Dialog from '@/components/ui/dialog/Dialog.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import ScrollEndButtons from '@/components/ui/scroll/ScrollEndButtons.vue';
import StudioDetailLayout from '@/features/studio/_components/StudioDetailLayout.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import StudioDocumentSection from '@/features/studio/_components/StudioDocumentSection.vue';

// ── Dynamic Components
const StudioDescriptorsPanel = defineLazyComponent(() => import('@/features/studio/_components/StudioDescriptorsPanel.vue'), 'StudioDescriptorsPanel');

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { eventQueryLocalisedConfig, isDeleting } = defineProps<{
    eventQueryLocalisedConfig: LocalisedConfig<EventQueryConfig>;
    isDeleting?: boolean; // A delete is under way, so the Delete button shows it and takes no second click.
}>();
defineEmits<{ close: []; delete: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Event Query ─ The stored record behind the localised one shown, which an edit changes for one language only.
const { data: eventQueryConfig } = useEventQuery(() => eventQueryLocalisedConfig.id);
const { mutateAsync: updateEventQuery } = useUpdateEventQuery();

// ── Edit Dialog ─ The edits are held here while the dialog is open and saved when it closes, as the context
// descriptors are applied when theirs closes.
const editDialogIsOpen = ref(false);
const editedDescription = ref('');
const editedLabel = ref('');
const editedSubjectLabel = ref(''); // Taken when the dialog opens, so its title holds steady while the label is edited.

// ── Scrolling
const documentScrollElement = shallowRef<HTMLElement>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Event ─ The context event the event query is for, named from the context as it is now, so the names follow the
// language. The area and model are named by the context, and the entity and event by the model, which loads separately.
const contextEventReference = computed(() => eventQueryLocalisedConfig.contextEventReference);
const { data: contextModelConfig, isPending: contextModelIsPending } = useContextModel(() => contextEventReference.value.modelId);
const contextAreaConfig = computed(() => contextConfig.value?.areas.find((config) => config.id === contextEventReference.value.areaId));
const contextEntityConfig = computed(() => contextModelConfig.value?.entities.find((config) => config.id === contextEventReference.value.entityId));

// Every fact is always listed. A name the context no longer has says 'Unknown', because a missing row would read as
// "not there", not "not known".
const contextEventFacts = computed(() => {
    const modelReferenceConfig = contextAreaConfig.value?.models.find((config) => config.id === contextEventReference.value.modelId);
    const eventConfig = contextEntityConfig.value?.events.find((config) => config.id === contextEventReference.value.eventId);
    const modelPartFallback = t(TEXT, contextModelIsPending.value ? 'event.pending.text' : 'event.unknown.text'); // The entity and event are not known until the model loads.
    return [
        {
            id: 'area',
            label: t(TEXT, 'event.area.label'),
            value: contextAreaConfig.value ? localiseConfig(contextAreaConfig.value, localeId.value).label : t(TEXT, 'event.unknown.text')
        },
        {
            id: 'model',
            label: t(TEXT, 'event.model.label'),
            value: modelReferenceConfig ? localiseReference(modelReferenceConfig, localeId.value).label : t(TEXT, 'event.unknown.text')
        },
        {
            id: 'entity',
            label: t(TEXT, 'event.entity.label'),
            value: contextEntityConfig.value ? localiseText(contextEntityConfig.value.label, localeId.value) : modelPartFallback
        },
        { id: 'event', label: t(TEXT, 'event.event.label'), value: eventConfig ? localiseText(eventConfig.labelAction, localeId.value) : modelPartFallback }
    ];
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useUnsavedWork(editDialogIsOpen); // The edits are only saved by the dialog's Save, so a reload while it is open loses them.

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleEditEventQuery(): void {
    editedDescription.value = eventQueryLocalisedConfig.description;
    editedLabel.value = eventQueryLocalisedConfig.label;
    editedSubjectLabel.value = eventQueryLocalisedConfig.label;
    editDialogIsOpen.value = true;
}

function handleCloseEditDialog(): void {
    editDialogIsOpen.value = false;
}

async function handleSaveEdits(): Promise<void> {
    editDialogIsOpen.value = false;

    const label = editedLabel.value.trim();
    if ((label === '' || label === eventQueryLocalisedConfig.label) && editedDescription.value === eventQueryLocalisedConfig.description) return; // An emptied label keeps the old one, since an event query must have a name.

    const storedEventQueryConfig = eventQueryConfig.value;
    if (!storedEventQueryConfig) return;

    // The edits go into the entry for the current language, leaving the other translations as they were.
    try {
        await updateEventQuery({
            ...storedEventQueryConfig,
            label: label === '' ? storedEventQueryConfig.label : { ...storedEventQueryConfig.label, [localeId.value]: label },
            description: { ...storedEventQueryConfig.description, [localeId.value]: editedDescription.value }
        });
    } catch (error) {
        // Announced rather than shown in the panel: the panel still shows the saved event query, which is still correct.
        raiseAppFailure(new AppError('Failed to save event query.', 'dpuse-app.EventQueryPanel.handleSaveEdits', { data: { typeId: 'handled' }, cause: error }));
    }
}
</script>

<template>
    <StudioDetailLayout data-region="EventQueryPanel">
        <ScrollArea
            class="flex-1"
            scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)"
            scroll-area-padding-left="var(--spacing-page)"
            @initialised="documentScrollElement = $event"
        >
            <StudioDocumentPanel :overline="t(TEXT, 'eventQueries.label')" :title="eventQueryLocalisedConfig.label" @close="$emit('close')">
                <template #actions>
                    <ActionWrapper :aria-label="t(TEXT, 'edit.aria', { name: eventQueryLocalisedConfig.label })" @click="handleEditEventQuery">
                        <SquarePenIcon aria-hidden="true" class="size-5" stroke-width="1.5" />
                    </ActionWrapper>
                </template>

                <!-- Description ─ A prompt in its place until the user writes one. The prompt is not stored, so it follows the
                     language and can never be saved as the user's own text. -->
                <div v-if="eventQueryLocalisedConfig.description" v-html="renderMarkdown(eventQueryLocalisedConfig.description)" />
                <p v-else class="text-muted">{{ t(TEXT, 'description.pending.text') }}</p>

                <!-- Event ─ Laid out as the data view panel's lists are: a line under every row but the last, and a label
                     column that widens to fit its longest label. -->
                <StudioDocumentSection :title="t(TEXT, 'event.title')">
                    <dl
                        class="grid grid-cols-[minmax(7.5rem,max-content)_1fr] text-sm *:border-b *:border-separator *:py-1 [&>:nth-last-child(-n+2)]:border-b-0 [&>dt]:pr-4"
                    >
                        <template v-for="fact in contextEventFacts" :key="fact.id">
                            <dt class="text-muted">{{ fact.label }}</dt>
                            <dd class="m-0 min-w-0 wrap-break-word">{{ fact.value }}</dd>
                        </template>
                    </dl>
                </StudioDocumentSection>

                <!-- Last, and apart from Edit, so a destructive action is never one slip away from an everyday one. -->
                <StudioDocumentSection :title="t(TEXT, 'delete.title')">
                    <p>{{ t(TEXT, 'delete.text') }}</p>
                    <RectangleButton :disabled="isDeleting" variant="destructive" @click="$emit('delete')">{{
                        t(TEXT, isDeleting ? 'delete.pending.label' : 'delete.label')
                    }}</RectangleButton>
                </StudioDocumentSection>
            </StudioDocumentPanel>
        </ScrollArea>

        <!-- Scroll Buttons ─ In the bottom row, because floating notices sit just above it. -->
        <ScrollEndButtons class="absolute right-6 bottom-(--safe-bottom-offset)" :scroll-element="documentScrollElement" />

        <Dialog
            :is-open="editDialogIsOpen"
            max-width="90vw"
            min-height="90vh"
            sizing="full"
            :title="t(TEXT, 'edit.title', { name: editedSubjectLabel })"
            @close="handleCloseEditDialog"
        >
            <StudioDescriptorsPanel v-model:label="editedLabel" v-model:description="editedDescription" />
            <div class="flex flex-none justify-end p-4">
                <RectangleButton variant="primary" @click="handleSaveEdits">{{ t(TEXT, 'edit.save.label') }}</RectangleButton>
            </div>
        </Dialog>
    </StudioDetailLayout>
</template>
