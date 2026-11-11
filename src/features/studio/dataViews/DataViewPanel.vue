<script setup lang="ts">
// ── External Dependencies & Registrations
import { SquarePenIcon } from '@lucide/vue';
import { computed, ref, shallowRef } from 'vue';
import { type RouteLocationRaw, useRoute } from 'vue-router';

// ── DPUse Framework
import { AppError, formatNumberAsStorageSize } from '@dpuse/dpuse-shared';
import type { DataViewConfig, LocalisedConfig, ReadingConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { defineLazyComponent } from '@/utilities/index.ts';
import { raiseAppFailure } from '@/state/errors';
import { renderMarkdown } from '@/services/useMarkedTool';
import { restoreItemReading } from './_dataViewColumns';
import { TEXT } from './DataViewPanel_.json';
import { useUnsavedWork } from '@/state/unsavedWork';
import { constructDataFormatLabel, constructRecordDelimiterLabel, constructValueDelimiterLabel } from './_readingLabels';
import type { DataViewConnection, DataViewStepId } from './dataViewSummary';
import { localeId, t } from '@/state/locale';
import { useDataView, useUpdateDataView } from '@/features/studio/dataViews/_dataViews';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConnectorDetails from './ConnectorDetails.vue';
import DataViewSource from './DataViewSource.vue';
import Dialog from '@/components/ui/dialog/Dialog.vue';
import PreviewColumnTable from './PreviewColumnTable.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import ScrollEndButtons from '@/components/ui/scroll/ScrollEndButtons.vue';
import ScrollRegion from '@/components/ui/scroll/ScrollRegion.vue';
import StudioDetailLayout from '@/features/studio/_components/StudioDetailLayout.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import StudioDocumentSection from '@/features/studio/_components/StudioDocumentSection.vue';

// ── Dynamic Components
const StudioDescriptorsPanel = defineLazyComponent(() => import('@/features/studio/_components/StudioDescriptorsPanel.vue'), 'StudioDescriptorsPanel');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COLLAPSED_TABLE_ROW_COUNT = 10; // Rows a long table shows until the user asks for the rest.
const NON_BREAKING_SPACE = '\u{A0}'; // Gives a cell with no value a line of text, so its row keeps its height.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { dataViewConnection, dataViewLocalisedConfig, isDeleting } = defineProps<{
    dataViewConnection: DataViewConnection | undefined; // Undefined until a connection is chosen.
    dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>;
    isDeleting?: boolean; // A delete is under way, so the Delete button shows it and takes no second click.
}>();
defineEmits<{ close: []; delete: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

// ── Data View ─ The stored record behind the localised one shown, which an edit changes for one language only.
const { data: dataViewConfig } = useDataView(() => dataViewLocalisedConfig.id);
const { mutateAsync: updateDataView } = useUpdateDataView();

// ── Edit Dialog ─ The edits are held here while the dialog is open and saved when it closes, as the context
// descriptors are applied when theirs closes.
const editDialogIsOpen = ref(false);
const editedDescription = ref('');
const editedLabel = ref('');
const editedSubjectLabel = ref(''); // Taken when the dialog opens, so its title holds steady while the label is edited.

// ── Tables ─ Each long table starts with its first rows only, so the document stays short until the user asks for more.
const columnTableIsExpanded = ref(false);
const dataTableIsExpanded = ref(false);

// ── Scrolling
const documentScrollElement = shallowRef<HTMLElement>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Item
// An item at the top of its connection has an empty folder path, shown as the top folder.
const itemFolderPath = computed(() => {
    const folderPath = dataViewLocalisedConfig.connectionNodeConfig?.folderPath;
    return folderPath == null || folderPath === '' ? '/' : folderPath;
});

// The item's name is the one the engine uses, with any extension, such as a DBnomics series code. Its title is shown as
// a description only when it says more, as a series title does. A file's title is its name, so a file shows none.
const itemName = computed(() => {
    const itemConfig = dataViewLocalisedConfig.connectionNodeConfig;
    if (!itemConfig) return;
    return itemConfig.extension == null ? itemConfig.name : `${itemConfig.name}.${itemConfig.extension}`;
});
const itemDescription = computed(() => {
    const itemLabel = dataViewLocalisedConfig.connectionNodeConfig?.label;
    return itemLabel === itemName.value ? undefined : itemLabel;
});

// The encoding the sample was decoded with, and why: the user's choice, or how detection found it. A chosen encoding the
// browser cannot decode is named, because the text was decoded as UTF-8 instead.
const itemEncodingText = computed(() => {
    const { readingChoiceConfig, readingConfig, sampleConfig } = dataViewLocalisedConfig;
    const encoding = sampleConfig?.decodedEncodingId ?? readingConfig?.encodingId;
    if (encoding == null) return;
    const chosenEncodingId = readingChoiceConfig?.encodingId;
    if (chosenEncodingId != null && chosenEncodingId !== encoding) return t(TEXT, 'item.encoding.undecodable.text', { encoding: chosenEncodingId });
    const sourceText = chosenEncodingId == null ? constructEncodingSourceText(readingConfig) : t(TEXT, 'item.encodingSource.choice.text');
    return sourceText == null ? encoding : t(TEXT, 'item.encoding.sourced.text', { encoding, source: sourceText });
});

// How many characters the encoding could not read. Shown only when there are some, because then the encoding is in doubt.
const itemUnreadableCharactersText = computed(() => {
    const count = dataViewLocalisedConfig.sampleConfig?.replacementCharacterCount ?? 0;
    return count > 0 ? t(TEXT, 'item.unreadableCharacters.text', { count: new Intl.NumberFormat(localeId.value).format(count) }) : undefined;
});

// The file's type and its encoding on one line, and its data type, delimiters and header row on another, as the sample
// was read. Either line shows whichever of its parts there are.
const itemTypeText = computed(() => formatListOfParts([dataViewLocalisedConfig.connectionNodeConfig?.mimeType, itemEncodingText.value, itemUnreadableCharactersText.value]));
const itemDataFormatText = computed(() => {
    const { readingConfig, sampleConfig } = dataViewLocalisedConfig;
    if (!readingConfig) return;
    const dataFormatId = sampleConfig?.dataFormatId ?? readingConfig.dataFormatId;
    const hasHeaders = sampleConfig?.hasHeaders ?? readingConfig.hasHeaders;
    const valueDelimiterId = sampleConfig?.valueDelimiterId ?? readingConfig.valueDelimiterId;
    const recordDelimiterId = sampleConfig?.recordDelimiterId ?? readingConfig.recordDelimiterId;
    let headerRowText: string | undefined;
    if (hasHeaders != null) headerRowText = t(TEXT, hasHeaders ? 'item.headerRow.text' : 'item.noHeaderRow.text');
    return formatListOfParts([
        constructDataFormatLabel(dataFormatId),
        valueDelimiterId == null ? undefined : constructValueDelimiterLabel(valueDelimiterId),
        recordDelimiterId == null ? undefined : constructRecordDelimiterLabel(recordDelimiterId),
        headerRowText
    ]);
});

const itemIsFile = computed(() => dataViewConnection?.itemTypeId === 'file');
const itemSubject = computed(() => dataViewConnection?.itemTypeId ?? 'item'); // Messages name the connector's kind of item, e.g. 'No file selected yet', and fall back to 'item' for a connector released before it said which.

// ── Columns
const columnTableItemReading = computed(() => restoreItemReading(dataViewLocalisedConfig));
const previewColumnLabels = computed(
    () => columnTableItemReading.value?.columnConfigs.map((config, index) => config.label[localeId.value] ?? config.label.en ?? String(index + 1)) ?? []
);

// ── Data ─ The rows of the sample saved with the item. Its first record is the header row, as SelectItemPanel treats it.
const previewRows = computed(() => dataViewLocalisedConfig.sampleConfig?.parsedRecords.slice(1) ?? []);

// ── Tables
const shownPreviewRows = computed(() => (dataTableIsExpanded.value ? previewRows.value : previewRows.value.slice(0, COLLAPSED_TABLE_ROW_COUNT)));

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
        raiseAppFailure(new AppError('Failed to save data view.', 'dpuse-app.DataViewPanel.handleSaveEdits', { typeId: 'handled' }, { cause: error }));
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────
function constructEncodingSourceText(readingConfig: ReadingConfig | undefined): string | undefined {
    if (readingConfig?.encodingSourceId == null) return;
    const { encodingSourceId } = readingConfig;
    if (encodingSourceId !== 'detection' || readingConfig.encodingConfidenceLevel == null) return t(TEXT, `item.encodingSource.${encodingSourceId}.text`);
    const confidence = new Intl.NumberFormat(localeId.value, { style: 'percent', maximumFractionDigits: 0 }).format(readingConfig.encodingConfidenceLevel);
    return t(TEXT, 'item.encodingSource.detection.text', { confidence });
}

// The route of one of the data view's steps, which each section links to so the user can go and change what it shows.
function constructStepRoute(stepId: DataViewStepId): RouteLocationRaw {
    return { name: stepId, params: { dataViewId: dataViewLocalisedConfig.id }, query: route.query };
}

// Joins the parts that are present as a list in the user's language, e.g. 'text/csv, UTF-8'. Undefined when none are.
function formatListOfParts(parts: (string | null | undefined)[]): string | undefined {
    const presentParts = parts.filter((part): part is string => part != null && part !== '');
    return presentParts.length === 0 ? undefined : new Intl.ListFormat(localeId.value, { style: 'short', type: 'unit' }).format(presentParts);
}

function formatDateTime(timestamp: number): string {
    return new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
}
</script>

<template>
    <StudioDetailLayout data-region="DataViewPanel">
        <ScrollArea
            class="flex-1"
            scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)"
            scroll-area-padding-left="var(--spacing-page)"
            @initialised="documentScrollElement = $event"
        >
            <!-- No icon beside the title, because the connection's icon is on its line below, as on the card. -->
            <StudioDocumentPanel :overline="t(TEXT, 'dataViews.label')" :title="dataViewLocalisedConfig.label" @close="$emit('close')">
                <template #actions>
                    <ActionWrapper :aria-label="t(TEXT, 'edit.aria', { name: dataViewLocalisedConfig.label })" @click="handleEditDataView">
                        <SquarePenIcon aria-hidden="true" class="size-5" stroke-width="1.5" />
                    </ActionWrapper>
                </template>

                <!-- Source -->
                <DataViewSource
                    class="mt-1 mb-4 text-sm"
                    :connection-id="dataViewLocalisedConfig.connectionId"
                    :connection-node-config="dataViewLocalisedConfig.connectionNodeConfig"
                    :data-format-id="dataViewLocalisedConfig.readingConfig?.dataFormatId"
                    :data-view-connection="dataViewConnection"
                    :item-type-id="dataViewConnection?.itemTypeId"
                />

                <!-- Description ─ A prompt in its place until the user writes one. The prompt is not stored, so it follows the
                     language and can never be saved as the user's own text. -->
                <div v-if="dataViewLocalisedConfig.description" v-html="renderMarkdown(dataViewLocalisedConfig.description)" />
                <p v-else class="text-muted">{{ t(TEXT, 'description.pending.text') }}</p>

                <!-- One section per part of the task, in the order it is done, each documenting what that part produced. A
                     section not reached yet keeps its heading and says so in one line, so the document's shape never
                     changes. -->
                <!-- Laid out as the item section is. The name and the connector are both shown, because one connector
                     can have several connections ('Dropbox', 'Dropbox (2)'). A line under every row shows where a value
                     that wraps ends, except under the last row when nothing follows it in the section, because the next
                     section's heading draws its own line. The label column is at least 7.5rem wide, so the values line up
                     across both lists, and widens to fit a longer label rather than letting it run into its value. -->
                <StudioDocumentSection :title="t(TEXT, 'connection.title')">
                    <dl
                        v-if="dataViewConnection"
                        class="grid grid-cols-[minmax(7.5rem,max-content)_1fr] text-sm *:border-b *:border-separator *:py-1 [&:is(:last-child,:has(+section))>:nth-last-child(-n+2)]:border-b-0 [&>dt]:pr-4"
                    >
                        <dt class="text-muted">{{ t(TEXT, 'connection.name.label') }}</dt>
                        <dd class="m-0 min-w-0 wrap-break-word">{{ dataViewConnection.label }}</dd>
                        <ConnectorDetails :data-view-connection="dataViewConnection" />
                    </dl>
                    <p v-else class="text-muted">{{ t(TEXT, 'connection.unavailable.text') }}</p>
                    <!-- On the right, as every step link in the panel is. -->
                    <div class="mt-2 flex px-3 text-sm">
                        <RouterLink class="ml-auto" :to="constructStepRoute('connection')">{{ t(TEXT, 'connection.change.label') }}</RouterLink>
                    </div>
                </StudioDocumentSection>

                <StudioDocumentSection :title="dataViewConnection?.itemTypeLabel ?? t(TEXT, 'item.title')">
                    <dl
                        v-if="dataViewLocalisedConfig.connectionNodeConfig"
                        class="grid grid-cols-[minmax(7.5rem,max-content)_1fr] text-sm *:border-b *:border-separator *:py-1 [&:is(:last-child,:has(+section))>:nth-last-child(-n+2)]:border-b-0 [&>dt]:pr-4"
                    >
                        <dt class="text-muted">{{ t(TEXT, 'item.folder.label') }}</dt>
                        <dd class="m-0 min-w-0 wrap-break-word">{{ itemFolderPath }}</dd>
                        <dt class="text-muted">{{ t(TEXT, 'item.name.label') }}</dt>
                        <dd class="m-0 min-w-0 wrap-break-word">{{ itemName }}</dd>
                        <template v-if="itemDescription">
                            <dt class="text-muted">{{ t(TEXT, 'item.description.label') }}</dt>
                            <dd class="m-0 min-w-0 wrap-break-word">{{ itemDescription }}</dd>
                        </template>
                        <!-- File Details ─ Only a file has a type, an encoding, a text layout, a size and a modified date. A table
                             or an API endpoint has none of them. -->
                        <template v-if="itemIsFile">
                            <template v-if="itemTypeText">
                                <dt class="text-muted">{{ t(TEXT, 'item.type.label') }}</dt>
                                <dd class="m-0">{{ itemTypeText }}</dd>
                            </template>
                            <template v-if="itemDataFormatText">
                                <dt class="text-muted">{{ t(TEXT, 'item.dataFormat.label') }}</dt>
                                <dd class="m-0">{{ itemDataFormatText }}</dd>
                            </template>
                            <template v-if="dataViewLocalisedConfig.connectionNodeConfig.size != null">
                                <dt class="text-muted">{{ t(TEXT, 'item.size.label') }}</dt>
                                <dd class="m-0">{{ formatNumberAsStorageSize(dataViewLocalisedConfig.connectionNodeConfig.size) }}</dd>
                            </template>
                            <template v-if="dataViewLocalisedConfig.connectionNodeConfig.lastModifiedAt != null">
                                <dt class="text-muted">{{ t(TEXT, 'item.lastModified.label') }}</dt>
                                <dd class="m-0">{{ formatDateTime(dataViewLocalisedConfig.connectionNodeConfig.lastModifiedAt) }}</dd>
                            </template>
                        </template>
                    </dl>
                    <p v-else class="text-muted">{{ t(TEXT, `${itemSubject}.pending.text`) }}</p>
                    <PreviewColumnTable
                        v-if="columnTableItemReading && previewColumnLabels.length > 0"
                        class="mt-4"
                        is-label-shown
                        :item-reading="columnTableItemReading"
                        :row-limit="columnTableIsExpanded ? undefined : COLLAPSED_TABLE_ROW_COUNT"
                    />
                    <!-- Show All and Change Item ─ Two columns: showing the rest of the table on the left, under the table it
                         expands, and going to the item step on the right. The left one wraps when it is too long, so the
                         step stays on the first line. An item is chosen from a connection, so there is nothing to go to
                         until one is chosen. -->
                    <div class="mt-2 grid grid-cols-[1fr_auto] items-start gap-x-4 px-3 text-sm">
                        <ActionWrapper
                            v-if="previewColumnLabels.length > COLLAPSED_TABLE_ROW_COUNT"
                            :aria-expanded="columnTableIsExpanded"
                            class="justify-self-start text-left text-accent hover:underline"
                            @click="columnTableIsExpanded = !columnTableIsExpanded"
                        >
                            {{ columnTableIsExpanded ? t(TEXT, 'column.showFewer.label') : t(TEXT, 'column.showAll.label', { count: previewColumnLabels.length }) }}
                        </ActionWrapper>
                        <RouterLink v-if="dataViewLocalisedConfig.connectionId" class="col-start-2 justify-self-end text-right" :to="constructStepRoute('item')">{{
                            t(TEXT, dataViewLocalisedConfig.connectionNodeConfig ? `${itemSubject}.change.label` : `${itemSubject}.select.label`)
                        }}</RouterLink>
                    </div>
                </StudioDocumentSection>

                <StudioDocumentSection :title="t(TEXT, 'data.title')">
                    <template v-if="previewRows.length > 0">
                        <!-- Scrolls sideways on its own, as the columns table does. Every row has a cell for every column,
                             because a record can have fewer values than the item has columns. A cell with no value holds a
                             non-breaking space, so a record with no values is as tall as the others. The label is for screen
                             readers only, because the section heading already names the table on screen. -->
                        <ScrollRegion v-slot="{ labelId }" :label="t(TEXT, 'dataTable.title')">
                            <table :aria-labelledby="labelId" class="text-sm whitespace-nowrap">
                                <thead>
                                    <tr class="text-left">
                                        <th v-for="(columnLabel, index) in previewColumnLabels" :key="index" class="py-1 pr-4 font-normal text-muted">{{ columnLabel }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(record, recordIndex) in shownPreviewRows" :key="recordIndex">
                                        <td v-for="(_columnLabel, columnIndex) in previewColumnLabels" :key="columnIndex" class="py-1 pr-4">
                                            {{ record[columnIndex]?.value || NON_BREAKING_SPACE }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </ScrollRegion>
                    </template>
                    <p v-else class="text-muted">{{ t(TEXT, `data.pending.${itemSubject}.text`) }}</p>
                    <!-- Show All and Explore Data ─ As in the item section: showing the rest of the table on the left, and the
                         next step on the right once there is a preview. -->
                    <div class="mt-2 grid grid-cols-[1fr_auto] items-start gap-x-4 px-3 text-sm">
                        <ActionWrapper
                            v-if="previewRows.length > COLLAPSED_TABLE_ROW_COUNT"
                            :aria-expanded="dataTableIsExpanded"
                            class="justify-self-start text-left text-accent hover:underline"
                            @click="dataTableIsExpanded = !dataTableIsExpanded"
                        >
                            {{ dataTableIsExpanded ? t(TEXT, 'data.showFewer.label') : t(TEXT, 'data.showAll.label', { count: previewRows.length }) }}
                        </ActionWrapper>
                        <RouterLink
                            v-if="dataViewLocalisedConfig.connectionNodeConfig && dataViewLocalisedConfig.sampleConfig"
                            class="col-start-2 justify-self-end text-right"
                            :to="constructStepRoute('data')"
                            >{{ t(TEXT, 'data.open.label') }}</RouterLink
                        >
                    </div>
                </StudioDocumentSection>

                <!-- Last, and apart from Edit, so a destructive action is never one slip away from an everyday one. Its own
                     section so it can grow to say what deleting would affect, once other things are built on data views. -->
                <StudioDocumentSection :title="t(TEXT, 'delete.title')">
                    <p>{{ t(TEXT, 'delete.text') }}</p>
                    <RectangleButton :disabled="isDeleting" variant="destructive" @click="$emit('delete')">{{
                        t(TEXT, isDeleting ? 'delete.pending.label' : 'delete.label')
                    }}</RectangleButton>
                </StudioDocumentSection>
            </StudioDocumentPanel>
        </ScrollArea>

        <!-- Scroll Buttons ─ In the bottom row, because floating notices sit just above it. 'right-30' clears the 'Open'
             pill in 'DataViewList', which is 24px from the edge and about 90px wide in both languages. -->
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
