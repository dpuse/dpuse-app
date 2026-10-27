<script setup lang="ts">
// ── External Dependencies & Registrations
import { SquarePenIcon } from '@lucide/vue';
import { computed, ref } from 'vue';
import { type RouteLocationRaw, useRoute } from 'vue-router';

// ── DPUse Framework
import { AppError, formatNumberAsStorageSize } from '@dpuse/dpuse-shared';
import type { DataFormatId, DataSubtypeId, DataTypeId, DataViewConfig, LocalisedConfig, RecordDelimiterId, ValueDelimiterId } from '@dpuse/dpuse-shared';

// ── Local Framework
import { defineLazyComponent } from '@/utilities/index.ts';
import { raiseAppFailure } from '@/state/errors';
import { renderMarkdown } from '@/services/useMarkedTool';
import { TEXT } from './DataViewPanel_.json';
import { useUnsavedWork } from '@/state/unsavedWork';
import type { DataViewConnection, DataViewStepId } from './dataViewSummary';
import { localeId, t } from '@/state/locale';
import { useDataView, useUpdateDataView } from '@/features/studio/dataViews/_dataViews';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConnectorDetails from './ConnectorDetails.vue';
import DataViewSource from './DataViewSource.vue';
import Dialog from '@/components/ui/dialog/Dialog.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import ScrollRegion from '@/components/ui/scroll/ScrollRegion.vue';
import StudioDetailLayout from '@/features/studio/_components/StudioDetailLayout.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import StudioDocumentSection from '@/features/studio/_components/StudioDocumentSection.vue';

// ── Dynamic Components
const StudioDescriptorsPanel = defineLazyComponent(() => import('@/features/studio/_components/StudioDescriptorsPanel.vue'), 'StudioDescriptorsPanel');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COLLAPSED_TABLE_ROW_COUNT = 10; // Rows a long table shows until the user asks for the rest.
const NON_BREAKING_SPACE = '\u{A0}'; // Gives a cell with no value a line of text, so its row keeps its height.

const DATA_FORMAT_LABEL_KEYS: Record<DataFormatId, keyof typeof TEXT> = {
    arrow: 'dataFormat.arrow.label',
    avro: 'dataFormat.avro.label',
    dtv: 'dataFormat.dtv.label',
    json: 'dataFormat.json.label',
    jsonl: 'dataFormat.jsonl.label',
    markdown: 'dataFormat.markdown.label',
    ods: 'dataFormat.ods.label',
    parquet: 'dataFormat.parquet.label',
    sav: 'dataFormat.sav.label',
    sqlite: 'dataFormat.sqlite.label',
    unknown: 'dataFormat.unknown.label',
    xlsx: 'dataFormat.xlsx.label',
    xml: 'dataFormat.xml.label'
};

const RECORD_DELIMITER_LABEL_KEYS: Record<RecordDelimiterId, keyof typeof TEXT> = {
    '\n': 'recordDelimiter.newline.label',
    '\r': 'recordDelimiter.carriageReturn.label',
    '\r\n': 'recordDelimiter.carriageReturnNewline.label'
};

const VALUE_DELIMITER_LABEL_KEYS: Record<ValueDelimiterId, keyof typeof TEXT> = {
    '': 'valueDelimiter.other.label',
    ':': 'valueDelimiter.colon.label',
    ',': 'valueDelimiter.comma.label',
    '!': 'valueDelimiter.exclamationMark.label',
    '0x1E': 'valueDelimiter.recordSeparator.label',
    ';': 'valueDelimiter.semicolon.label',
    ' ': 'valueDelimiter.space.label',
    '\t': 'valueDelimiter.tab.label',
    _: 'valueDelimiter.underscore.label',
    '0x1F': 'valueDelimiter.unitSeparator.label',
    '|': 'valueDelimiter.verticalBar.label'
};

const DATA_TYPE_LABEL_KEYS: Record<DataTypeId, keyof typeof TEXT> = {
    boolean: 'dataType.boolean.label',
    numeric: 'dataType.numeric.label',
    string: 'dataType.string.label',
    temporal: 'dataType.temporal.label',
    unknown: 'dataType.unknown.label'
};

const DATA_SUBTYPE_LABEL_KEYS: Record<DataSubtypeId, keyof typeof TEXT> = {
    bigint: 'dataSubtype.bigint.label',
    date: 'dataSubtype.date.label',
    dateTime: 'dataSubtype.dateTime.label',
    decimal: 'dataSubtype.decimal.label',
    email: 'dataSubtype.email.label',
    integer: 'dataSubtype.integer.label',
    ipv4: 'dataSubtype.ipv4.label',
    ipv6: 'dataSubtype.ipv6.label',
    plain: 'dataSubtype.plain.label',
    time: 'dataSubtype.time.label',
    ulid: 'dataSubtype.ulid.label',
    url: 'dataSubtype.url.label',
    uuid: 'dataSubtype.uuid.label'
};

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

// The encoding the preview detected, with how sure the detection was. Without a confidence level nothing was detected and
// the preview fell back to UTF-8, so the encoding is marked as assumed.
const itemEncodingText = computed(() => {
    const previewConfig = dataViewLocalisedConfig.previewConfig;
    if (previewConfig?.encodingId == null) return;
    const encoding = previewConfig.encodingId;
    if (previewConfig.encodingConfidenceLevel == null) return t(TEXT, 'item.encoding.assumed.text', { encoding });
    const confidence = new Intl.NumberFormat(localeId.value, { style: 'percent', maximumFractionDigits: 0 }).format(previewConfig.encodingConfidenceLevel);
    return t(TEXT, 'item.encoding.text', { confidence, encoding });
});

// The file's type and its encoding on one line, and its data type, delimiters and header row on another. Either line
// shows whichever of its parts there are.
const itemTypeText = computed(() => formatListOfParts([dataViewLocalisedConfig.connectionNodeConfig?.mimeType, itemEncodingText.value]));
const itemDataFormatText = computed(() => {
    const previewConfig = dataViewLocalisedConfig.previewConfig;
    if (!previewConfig) return;
    let headerRowText: string | undefined;
    if (previewConfig.hasHeaders != null) headerRowText = t(TEXT, previewConfig.hasHeaders ? 'item.headerRow.text' : 'item.noHeaderRow.text');
    return formatListOfParts([
        t(TEXT, DATA_FORMAT_LABEL_KEYS[previewConfig.dataFormatId]),
        previewConfig.valueDelimiterId == null ? undefined : t(TEXT, VALUE_DELIMITER_LABEL_KEYS[previewConfig.valueDelimiterId]),
        previewConfig.recordDelimiterId == null ? undefined : t(TEXT, RECORD_DELIMITER_LABEL_KEYS[previewConfig.recordDelimiterId]),
        headerRowText
    ]);
});

const itemIsFile = computed(() => dataViewConnection?.itemTypeId === 'file');
const itemSubject = computed(() => dataViewConnection?.itemTypeId ?? 'item'); // Messages name the connector's kind of item, e.g. 'No file selected yet', and fall back to 'item' for a connector released before it said which.

// ── Columns ─ The columns of the preview saved with the item, with the type the preview inferred for each. The match
// is the share of sampled values, the header excluded, that fitted that type, as the engine counts it when it chooses.
const previewColumnLabels = computed(
    () => dataViewLocalisedConfig.previewConfig?.columnConfigs.map((config, index) => config.label[localeId.value] ?? config.label.en ?? String(index + 1)) ?? []
);
const previewColumnRows = computed(() => {
    const previewConfig = dataViewLocalisedConfig.previewConfig;
    if (!previewConfig) return [];
    const percentFormat = new Intl.NumberFormat(localeId.value, { style: 'percent', maximumFractionDigits: 0 });
    return previewConfig.columnConfigs.map((columnConfig, index) => {
        const sampleCounts = Object.entries(columnConfig.inferenceCounts).map(([inferenceTypeId, count]) => ({
            inferenceTypeId,
            count: previewConfig.hasHeaders === true ? count - (columnConfig.leadingInferenceCounts[inferenceTypeId] ?? 0) : count
        }));
        const total = sampleCounts.reduce((sum, sampleCount) => sum + sampleCount.count, 0);
        const chosenInferenceTypeId = columnConfig.dataSubtypeId === undefined ? columnConfig.dataTypeId : `${columnConfig.dataTypeId}.${columnConfig.dataSubtypeId}`;
        const count = sampleCounts.find((sampleCount) => sampleCount.inferenceTypeId === chosenInferenceTypeId)?.count ?? 0;
        return {
            label: previewColumnLabels.value[index],
            dataTypeLabel: t(TEXT, DATA_TYPE_LABEL_KEYS[columnConfig.dataTypeId]),
            dataSubtypeLabel:
                columnConfig.dataSubtypeId === undefined || columnConfig.dataSubtypeId === 'plain' ? '' : t(TEXT, DATA_SUBTYPE_LABEL_KEYS[columnConfig.dataSubtypeId]), // Plain text has no special format, so it gets no subtype label and real subtypes stand out.
            matchText: formatMatchText(count, total, percentFormat)
        };
    });
});

// ── Data ─ The rows of the preview saved with the item. Its first record is the header row, as SelectItemPanel treats it.
const previewRows = computed(() => dataViewLocalisedConfig.previewConfig?.parsedRecords.slice(1) ?? []);

// ── Tables
const shownPreviewColumnRows = computed(() => (columnTableIsExpanded.value ? previewColumnRows.value : previewColumnRows.value.slice(0, COLLAPSED_TABLE_ROW_COUNT)));
const shownPreviewRows = computed(() => (dataTableIsExpanded.value ? previewRows.value : previewRows.value.slice(0, COLLAPSED_TABLE_ROW_COUNT)));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useUnsavedWork(editDialogIsOpen); // The edits are only saved when the dialog closes, so a reload while it is open loses them.

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleEditDataView(): void {
    editedDescription.value = dataViewLocalisedConfig.description;
    editedLabel.value = dataViewLocalisedConfig.label;
    editedSubjectLabel.value = dataViewLocalisedConfig.label;
    editDialogIsOpen.value = true;
}

async function handleCloseEditDialog(): Promise<void> {
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
        raiseAppFailure(new AppError('Failed to save data view.', 'dpuse-app.DataViewPanel.handleCloseEditDialog', { typeId: 'handled' }, { cause: error }));
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The route of one of the data view's steps, which each section links to so the user can go and change what it shows.
function constructStepRoute(stepId: DataViewStepId): RouteLocationRaw {
    return { name: stepId, params: { dataViewId: dataViewLocalisedConfig.id }, query: route.query };
}

// A full match is just '100%'. The counts are only added below that, so a weak guess stands out.
function formatMatchText(count: number, total: number, percentFormat: Intl.NumberFormat): string {
    if (total === 0) return '';
    const percent = percentFormat.format(count / total);
    return count === total ? percent : t(TEXT, 'column.match.text', { percent, count, total });
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
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)" scroll-area-padding-left="var(--spacing-page)">
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
                    :data-format-id="dataViewLocalisedConfig.previewConfig?.dataFormatId"
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
                    <!-- Columns ─ Scrolls sideways on its own, so a wide item does not widen the document. The title is shown
                         above the region's frame, which a caption inside the table cannot be, and names the table. -->
                    <ScrollRegion v-if="previewColumnRows.length > 0" v-slot="{ labelId }" class="mt-4" is-label-shown :label="t(TEXT, 'columnTable.title')">
                        <table :aria-labelledby="labelId" class="text-sm whitespace-nowrap">
                            <thead>
                                <tr class="text-left">
                                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.label') }}</th>
                                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.dataType.label') }}</th>
                                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.dataSubtype.label') }}</th>
                                    <th class="py-1 font-normal text-muted">{{ t(TEXT, 'column.match.label') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(columnRow, index) in shownPreviewColumnRows" :key="index">
                                    <td class="py-1 pr-4">{{ columnRow.label }}</td>
                                    <td class="py-1 pr-4">{{ columnRow.dataTypeLabel }}</td>
                                    <!-- A column with no subtype is left blank on screen, and screen readers hear 'None',
                                         because a blank cell alone does not say why it is empty. 'relative' keeps the hidden
                                         text inside the scroller, or iOS Safari scrolls the whole page sideways. -->
                                    <td v-if="columnRow.dataSubtypeLabel" class="py-1 pr-4">{{ columnRow.dataSubtypeLabel }}</td>
                                    <td v-else class="relative py-1 pr-4">
                                        <span class="sr-only">{{ t(TEXT, 'column.dataSubtype.none.text') }}</span>
                                    </td>
                                    <td class="py-1">{{ columnRow.matchText }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </ScrollRegion>
                    <!-- Show All and Change Item ─ Two columns: showing the rest of the table on the left, under the table it
                         expands, and going to the item step on the right. The left one wraps when it is too long, so the
                         step stays on the first line. An item is chosen from a connection, so there is nothing to go to
                         until one is chosen. -->
                    <div class="mt-2 grid grid-cols-[1fr_auto] items-start gap-x-4 px-3 text-sm">
                        <ActionWrapper
                            v-if="previewColumnRows.length > COLLAPSED_TABLE_ROW_COUNT"
                            :aria-expanded="columnTableIsExpanded"
                            class="justify-self-start text-left text-accent hover:underline"
                            @click="columnTableIsExpanded = !columnTableIsExpanded"
                        >
                            {{ columnTableIsExpanded ? t(TEXT, 'column.showFewer.label') : t(TEXT, 'column.showAll.label', { count: previewColumnRows.length }) }}
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
                         next step on the right once the audit is done. -->
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
                            v-if="dataViewLocalisedConfig.connectionNodeConfig && dataViewLocalisedConfig.contentAuditConfig"
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

        <Dialog
            :is-open="editDialogIsOpen"
            max-width="90vw"
            min-height="90vh"
            sizing="full"
            :title="t(TEXT, 'edit.title', { name: editedSubjectLabel })"
            @close="handleCloseEditDialog"
        >
            <StudioDescriptorsPanel v-model:label="editedLabel" v-model:description="editedDescription" />
        </Dialog>
    </StudioDetailLayout>
</template>
