<script setup lang="ts">
// ── External Dependencies & Registrations
import { SquarePenIcon } from '@lucide/vue';
import { computed, ref, shallowRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataViewConnection } from '@/features/studio/dataViews/_state/dataViewSummary';
import { defineLazyComponent } from '@/utilities/index.ts';
import { isDataViewLoaded } from '@/features/studio/dataViews/_state/dataViewStore';
import { raiseAppFailure } from '@/state/errors';
import { renderMarkdown } from '@/services/useMarkedTool';
import { restoreItemReading } from '@/features/studio/dataViews/_state/dataViewColumns';
import { TEXT } from './DataViewDetail_.json';
import { useUnsavedWork } from '@/state/unsavedWork';
import { localeId, t } from '@/state/locale';
import { useDataView, useUpdateDataView } from '@/features/studio/dataViews/_state/dataViews';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConnectorDetail from '@/features/studio/dataViews/_components/ConnectorDetail.vue';
import DataViewDocument from '@/features/studio/dataViews/_components/DataViewDocument.vue';
import Dialog from '@/components/ui/dialog/Dialog.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import ScrollEndButtons from '@/components/ui/scroll/ScrollEndButtons.vue';
import StudioDetailLayout from '@/features/studio/_components/StudioDetailLayout.vue';
import StudioDocumentSection from '@/features/studio/_components/StudioDocumentSection.vue';

// ── Dynamic Components
const StudioDescriptorsPanel = defineLazyComponent(() => import('@/features/studio/_components/StudioDescriptorsPanel.vue'), 'StudioDescriptorsPanel');

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { dataViewConnection, dataViewLocalisedConfig, isDeleting } = defineProps<{
    dataViewConnection: DataViewConnection | undefined; // Undefined until a connection is chosen.
    dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>;
    isDeleting?: boolean; // A delete is under way, so the Delete button shows it and takes no second click.
}>();
defineEmits<{ close: []; delete: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Data View ─ The stored record behind the localised one shown, which an edit changes for one language only.
const { data: dataViewConfig } = useDataView(() => dataViewLocalisedConfig.id);
const { mutateAsync: updateDataView } = useUpdateDataView();

// ── Edit Dialog ─ The edits are held here while the dialog is open and saved when it closes, as the context
// descriptors are applied when theirs closes.
const editDialogIsOpen = ref(false);
const editedDescription = ref('');
const editedLabel = ref('');
const editedSubjectLabel = ref(''); // Taken when the dialog opens, so its title holds steady while the label is edited.

// ── Scrolling
const documentScrollElement = shallowRef<HTMLElement>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Reading ─ What the saved sample was read with, and its columns as the user typed them.
const itemReading = computed(() => restoreItemReading(dataViewLocalisedConfig));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useUnsavedWork(editDialogIsOpen); // The edits are only saved by the dialog's Save, so a reload while it is open loses them.

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleEditDataView(): void {
    editedDescription.value = dataViewLocalisedConfig.description;
    editedLabel.value = dataViewLocalisedConfig.label;
    editedSubjectLabel.value = dataViewLocalisedConfig.label;
    editDialogIsOpen.value = true;
}

function handleCloseEditDialog(): void {
    editDialogIsOpen.value = false;
}

async function handleSaveEdits(): Promise<void> {
    editDialogIsOpen.value = false;

    const label = editedLabel.value.trim();
    if ((label === '' || label === dataViewLocalisedConfig.label) && editedDescription.value === dataViewLocalisedConfig.description) return; // An emptied label keeps the old one, since a data view must have a name.

    const storedDataViewConfig = dataViewConfig.value;
    if (!storedDataViewConfig) return;

    // The edits go into the entry for the current language, leaving the other translations as they were.
    try {
        await updateDataView({
            ...storedDataViewConfig,
            label: label === '' ? storedDataViewConfig.label : { ...storedDataViewConfig.label, [localeId.value]: label },
            description: { ...storedDataViewConfig.description, [localeId.value]: editedDescription.value }
        });
    } catch (error) {
        // Announced rather than shown in the panel: the panel still shows the saved data view, which is still correct.
        raiseAppFailure(new AppError('Failed to save data view.', 'dpuse-app.DataViewDetail.handleSaveEdits', { data: { typeId: 'handled' }, cause: error }));
    }
}
</script>

<template>
    <StudioDetailLayout data-region="DataViewDetail">
        <ScrollArea
            class="flex-1"
            scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)"
            scroll-area-padding-left="var(--spacing-page)"
            @initialised="documentScrollElement = $event"
        >
            <!-- No icon beside the title, because the connection's icon is on its line below, as on the card. -->
            <DataViewDocument
                :chosen-encoding-id="dataViewLocalisedConfig.readingChoiceConfig?.encodingId"
                :connection-id="dataViewLocalisedConfig.connectionId"
                :connection-node-config="dataViewLocalisedConfig.connectionNodeConfig"
                :content-audit-config="dataViewLocalisedConfig.contentAuditConfig"
                :data-view-connection="dataViewConnection"
                :data-view-id="dataViewLocalisedConfig.id"
                :detected-reading-config="dataViewLocalisedConfig.readingConfig"
                :is-loaded="isDataViewLoaded(dataViewLocalisedConfig, false)"
                :item-reading="itemReading"
                :overline="t(TEXT, 'dataViews.label')"
                :store-connector-id="dataViewLocalisedConfig.storeConnectorId"
                :title="dataViewLocalisedConfig.label"
                @close="$emit('close')"
            >
                <template #actions>
                    <ActionWrapper :aria-label="t(TEXT, 'edit.aria', { name: dataViewLocalisedConfig.label })" @click="handleEditDataView">
                        <SquarePenIcon aria-hidden="true" class="size-5" stroke-width="1.5" />
                    </ActionWrapper>
                </template>

                <!-- Description ─ Muted, so the title above it and the facts below it lead. A prompt in its place until the
                     user writes one. The prompt is not stored, so it follows the language and can never be saved as the
                     user's own text. -->
                <template #description>
                    <div v-if="dataViewLocalisedConfig.description" class="text-muted" v-html="renderMarkdown(dataViewLocalisedConfig.description)" />
                    <p v-else class="text-muted">{{ t(TEXT, 'description.pending.text') }}</p>
                </template>

                <!-- Connector ─ Near the end, because the connector matters less than the item and its columns. The
                     connection's name is already on the line under the title. Laid out as the document's other lists
                     are. -->
                <StudioDocumentSection :title="t(TEXT, 'connector.title')">
                    <dl
                        v-if="dataViewConnection"
                        class="grid grid-cols-[minmax(6rem,min(11rem,40%))_minmax(0,1fr)] text-sm *:border-b *:border-separator *:py-1 [&:is(:last-child,:has(+section))>:nth-last-child(-n+2)]:border-b-0 [&>dt]:pr-4 [&>dt]:wrap-break-word"
                    >
                        <ConnectorDetail :data-view-connection="dataViewConnection" />
                    </dl>
                    <p v-else class="text-muted">{{ t(TEXT, 'connection.unavailable.text') }}</p>
                </StudioDocumentSection>

                <!-- Last, and apart from Edit, so a destructive action is never one slip away from an everyday one. Its own
                     section so it can grow to say what deleting would affect, once other things are built on data views.
                     The heading takes the danger colour, as the Delete button does, so the section reads as a warning. -->
                <StudioDocumentSection class="[&_h2]:text-danger-text" :title="t(TEXT, 'delete.title')">
                    <p>{{ t(TEXT, 'delete.text') }}</p>
                    <RectangleButton :disabled="isDeleting" variant="destructive" @click="$emit('delete')">{{
                        t(TEXT, isDeleting ? 'delete.pending.label' : 'delete.label')
                    }}</RectangleButton>
                </StudioDocumentSection>
            </DataViewDocument>
        </ScrollArea>

        <!-- Scroll Buttons ─ In the bottom row, because floating notices sit just above it. 'right-30' clears the 'Open'
             pill in 'DataViewsOverview', which is 24px from the edge and about 90px wide in both languages. -->
        <ScrollEndButtons class="absolute right-30 bottom-(--safe-bottom-offset)" :scroll-element="documentScrollElement" />

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
