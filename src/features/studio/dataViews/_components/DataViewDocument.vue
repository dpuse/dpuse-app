<script setup lang="ts">
// The document of a data view's item, shown beside the data views on the overview and on the item step's Details tab,
// so both say the same thing in the same words. Each section shows only when it has something to show. The caller
// sets the heading and adds the sections only it has after the shared ones, such as the data and the connection.

// ── External Dependencies & Registrations
import { computed, ref } from 'vue';
import { type RouteLocationRaw, useRoute } from 'vue-router';

// ── DPUse Framework
import type { ConnectionNodeConfig, ContentAuditConfig, ReadingConfig } from '@dpuse/dpuse-shared';
import { formatNumberAsDecimalNumber, formatNumberAsStorageSize, localiseConfigs } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { isDerivedColumn } from '@/features/studio/dataViews/_state/dataViewColumns';
import type { ItemReading } from '@/features/studio/dataViews/_state/dataViewColumns';
import { resolveDataViewStore } from '@/features/studio/dataViews/_state/dataViewStore';
import { TASK_CONFIGS } from '@/features/studio/dataViews/_useDataViewTasks_.json';
import { TEXT } from './DataViewDocument_.json';
import { toolConfigs } from '@/state/configs';
import { constructDataFormatLabel, constructRecordDelimiterLabel, constructValueDelimiterLabel } from './readingLabels';
import { constructLoadTimingParts, type DataViewLoadTiming, findDataViewLoadTiming } from '@/features/studio/dataViews/_state/dataViewStore';
import type { DataViewConnection, DataViewStepId } from '@/features/studio/dataViews/_state/dataViewSummary';
import { formatFinishedDuration, formatStatusPercentage } from './_statusBar';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import DataViewSource from './DataViewSource.vue';
import PreviewColumnTable from '@/features/studio/dataViews/_columns/PreviewColumnTable.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import StudioDocumentSection from '@/features/studio/_components/StudioDocumentSection.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// A link at the end of one of the heading's lines, to the step that changes what the line names.
interface StepLink {
    label: string;
    stepNumber: number;
    to: RouteLocationRaw;
}

interface DetailSection {
    id: string;
    title: string;
    details: { labelKey: keyof typeof TEXT; value: string | undefined }[];
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COLLAPSED_COLUMN_COUNT = 10; // Columns the table shows until the user asks for the rest.
const CONTAINER_FILE_TYPE_EXTENSIONS = new Set(['cfb']); // Detected types that only name a container, e.g. a legacy Office file, so the item's own extension names it better.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const {
    chosenEncodingId,
    connectionId,
    connectionNodeConfig,
    contentAuditConfig,
    currentStepId,
    dataViewConnection,
    dataViewId,
    detectedReadingConfig,
    isLoaded,
    itemReading,
    storeConnectorId
} = defineProps<{
    chosenEncodingId?: string | undefined; // The encoding the user chose, if any, which the encoding row names as chosen.
    connectionId: string | undefined;
    connectionNodeConfig: ConnectionNodeConfig | undefined; // Undefined until an item is chosen.
    contentAuditConfig?: ContentAuditConfig | undefined;
    currentStepId?: DataViewStepId | undefined; // The step the document is shown on, which its heading does not link to.
    dataViewConnection: DataViewConnection | undefined;
    dataViewId: string | undefined; // Finds the data view's last load, for its timings.
    detectedReadingConfig?: Pick<ReadingConfig, 'encodingConfidenceLevel' | 'encodingSourceId'> | undefined; // How detection found the encoding.
    isLoaded?: boolean; // The records are in the store and still match the columns.
    itemReading: ItemReading | undefined; // Undefined until the item has been read.
    overline?: string;
    storeConnectorId?: string | undefined; // Undefined for the default store.
    title: string;
}>();

defineSlots<{
    actions?(): unknown; // Beside the title.
    'after-columns'?(): unknown; // Sections straight after the columns, such as the data.
    default?(): unknown; // Sections after all the others.
    description?(): unknown; // Under the title, above the heading's lines.
    intro?(): unknown; // Under the heading's lines.
}>();

defineEmits<{ close: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const columnTableIsExpanded = ref(false); // A long table starts with its first rows only, so the document stays short until the user asks for more.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Step Links ─ The heading's connection, item and store lines end in links to the steps that change them, as the task
// bar's steps do.
// A step that cannot be opened yet is not linked: an item is chosen from a connection, and the records can only be
// explored once the item has been previewed. A new data view is not saved yet, so it is named as the route names it.
const linkedDataViewId = computed(() => dataViewId ?? (typeof route.params.dataViewId === 'string' ? route.params.dataViewId : undefined));
const connectionStepLink = computed(() => constructStepLink('connection', 'step.connection.aria', true));
const itemStepLink = computed(() => constructStepLink('item', connectionNodeConfig == null ? 'step.itemSelect.aria' : 'step.itemChange.aria', connectionId != null));
const dataStepLink = computed(() => constructStepLink('data', 'step.data.aria', connectionNodeConfig != null && itemReading != null));

// ── Store ─ Where the records are loaded, and whether they are there yet.
const storeLine = computed(() => ({ ...resolveDataViewStore({ storeConnectorId }), isLoaded }));

// ── Item
const itemIsFile = computed(() => dataViewConnection?.itemTypeId === 'file');
const itemSubject = computed(() => dataViewConnection?.itemTypeId ?? 'item'); // Messages name the connector's kind of item, e.g. 'No file selected yet', and fall back to 'item' for a connector released before it said which.

// The item's title is shown as a description only when it says more than its name, as a series title does. A file's
// title is its name, so a file shows none.
const itemDescription = computed(() => {
    if (!connectionNodeConfig) return;
    const name = connectionNodeConfig.extension == null ? connectionNodeConfig.name : `${connectionNodeConfig.name}.${connectionNodeConfig.extension}`;
    return connectionNodeConfig.label === name ? undefined : connectionNodeConfig.label;
});

// Only a file has a type, an encoding and a way of being parsed. A table or an API endpoint has none of them.
const itemDetailSection = computed<DetailSection | undefined>(() => {
    if (!connectionNodeConfig) return;
    return {
        id: 'details',
        title: t(TEXT, 'detail.details.title'),
        details: [
            { labelKey: 'detail.description.label', value: itemDescription.value },
            { labelKey: 'detail.fileType.label', value: itemIsFile.value ? (itemReading?.fileType?.mime ?? connectionNodeConfig.mimeType) : undefined },
            { labelKey: 'detail.encoding.label', value: itemReading && itemIsFile.value ? constructEncodingText(itemReading) : undefined },
            { labelKey: 'detail.size.label', value: connectionNodeConfig.size == null ? undefined : formatNumberAsStorageSize(connectionNodeConfig.size) },
            { labelKey: 'detail.lastModified.label', value: connectionNodeConfig.lastModifiedAt == null ? undefined : formatDateTime(connectionNodeConfig.lastModifiedAt) }
        ]
    };
});

// ── Item Parts ─ What parsing, auditing and loading the item found. A part with nothing to show is left out.
const parserLabel = computed(() => {
    const parserId = itemReading?.parserId;
    if (parserId == null) return;
    const parserToolConfigs = localiseConfigs(
        toolConfigs.value.filter((toolConfig) => toolConfig.parser != null),
        localeId.value
    );
    return parserToolConfigs.find((parserToolConfig) => parserToolConfig.id === parserId)?.label;
});
const issueCountText = computed(() => {
    const count = itemReading?.issues.length ?? 0;
    if (count === 0) return;
    return t(TEXT, count === 1 ? 'issue.one.text' : 'issue.other.text', { count });
});
const loadTiming = computed(() => (dataViewId == null ? undefined : findDataViewLoadTiming(dataViewId)));
const sections = computed(() => {
    const detailSections: DetailSection[] = [];
    if (itemReading && itemIsFile.value) {
        detailSections.push({
            id: 'reading',
            title: t(TEXT, 'detail.reading.title'),
            details: [
                { labelKey: 'detail.dataFormat.label', value: constructDataFormatText(itemReading) },
                { labelKey: 'detail.parser.label', value: parserLabel.value },
                { labelKey: 'detail.recordDelimiter.label', value: constructRecordDelimiterText(itemReading) },
                { labelKey: 'detail.valueDelimiter.label', value: constructValueDelimiterText(itemReading) },
                { labelKey: 'detail.hasHeaders.label', value: constructHeadersText(itemReading) },
                {
                    labelKey: 'detail.unreadableCharacters.label',
                    value: itemReading.replacementCharacterCount == null ? undefined : formatCount(itemReading.replacementCharacterCount)
                },
                { labelKey: 'detail.issues.label', value: issueCountText.value }
            ]
        });
    }
    if (contentAuditConfig) detailSections.push(constructAuditSection(contentAuditConfig));
    if (loadTiming.value) detailSections.push(constructLoadSection(loadTiming.value));
    return detailSections;
});

// ── Columns
const columnCount = computed(() => itemReading?.columnConfigs.filter((columnConfig) => !isDerivedColumn(columnConfig)).length ?? 0); // The columns the table lists, which leaves out derived ones.

// ── Item Section ─ The item's details, how it was parsed, what the audit found and the last load, as parts of one
// section about the item. Each part shows only the facts there are, and a part with none is left out.
const itemSectionTitle = computed(() => dataViewConnection?.itemTypeLabel ?? t(TEXT, 'item.title'));
const shownItemParts = computed(() =>
    [itemDetailSection.value, ...sections.value]
        .filter((section) => section != null)
        .map((section) => omitMissingDetails(section))
        .filter((section) => section.details.length > 0)
);

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The link shows the step's number from the task bar, so the reader can find the step there too.
function constructStepLink(stepId: DataViewStepId, labelKey: keyof typeof TEXT, canBeOpened: boolean): StepLink | undefined {
    if (!canBeOpened || stepId === currentStepId || linkedDataViewId.value == null) return;
    const stepNumber = assertDefined(TASK_CONFIGS.find((taskConfig) => taskConfig.id === stepId)).number;
    const to: RouteLocationRaw = { name: stepId, params: { dataViewId: linkedDataViewId.value }, query: route.query };
    return { label: t(TEXT, labelKey, { number: String(stepNumber) }), stepNumber, to };
}

function omitMissingDetails(section: DetailSection): DetailSection {
    return { ...section, details: section.details.filter((detail) => detail.value != null && detail.value !== '') };
}

// The encoding the sample was decoded with, and why: the user's choice, or how detection found it. A chosen encoding the
// browser cannot decode is named, because the text was decoded as UTF-8 instead.
function constructEncodingText(reading: ItemReading): string | undefined {
    const encoding = reading.decodedEncodingId ?? reading.encodingId;
    if (encoding == null) return;
    if (chosenEncodingId != null && chosenEncodingId !== encoding) return t(TEXT, 'detail.encoding.undecodable.text', { encoding: chosenEncodingId });
    const sourceText =
        chosenEncodingId == null
            ? constructEncodingSourceText(detectedReadingConfig?.encodingSourceId, detectedReadingConfig?.encodingConfidenceLevel)
            : t(TEXT, 'encodingSource.choice.text');
    return sourceText == null ? encoding : t(TEXT, 'detail.sourced.text', { source: sourceText, value: encoding });
}

function constructEncodingSourceText(encodingSourceId: ReadingConfig['encodingSourceId'], confidenceLevel: number | undefined): string | undefined {
    if (encodingSourceId == null) return;
    if (encodingSourceId !== 'detection' || confidenceLevel == null) return t(TEXT, `encodingSource.${encodingSourceId}.text`);
    const confidence = new Intl.NumberFormat(localeId.value, { style: 'percent', maximumFractionDigits: 0 }).format(confidenceLevel);
    return t(TEXT, 'encodingSource.detection.text', { confidence });
}

// A file recognised as something other than data, such as a PDF or an image, has no format, so the type the preview
// detected names it instead. A container type names it by the item's extension, so a legacy Excel file reads 'XLS'.
function constructDataFormatText({ dataFormatId, fileType }: ItemReading): string {
    if (fileType == null || dataFormatId !== 'unknown') return constructDataFormatLabel(dataFormatId);
    const itemExtension = connectionNodeConfig?.extension;
    const isNamedByItem = itemExtension != null && itemExtension !== '' && CONTAINER_FILE_TYPE_EXTENSIONS.has(fileType.ext);
    return (isNamedByItem ? itemExtension : fileType.ext).toUpperCase();
}

// Headers and delimiters only apply to delimited text. There they always show, and a parse that found none says so.
function constructHeadersText({ dataFormatId, hasHeaders }: ItemReading): string | undefined {
    if (dataFormatId !== 'dtv') return;
    if (hasHeaders == null) return t(TEXT, 'detail.notDetected.text');
    return t(TEXT, hasHeaders ? 'detail.hasHeaders.yes.text' : 'detail.hasHeaders.no.text');
}

function constructRecordDelimiterText({ dataFormatId, recordDelimiterId }: ItemReading): string | undefined {
    if (dataFormatId !== 'dtv') return;
    return recordDelimiterId == null ? t(TEXT, 'detail.notDetected.text') : constructRecordDelimiterLabel(recordDelimiterId);
}

function constructValueDelimiterText({ dataFormatId, valueDelimiterId }: ItemReading): string | undefined {
    if (dataFormatId !== 'dtv') return;
    return valueDelimiterId == null ? t(TEXT, 'detail.notDetected.text') : constructValueDelimiterLabel(valueDelimiterId);
}

// How much of the item the audit read, and what share of the item that is when its size is known.
function constructAuditedAmountText(auditConfig: ContentAuditConfig): string | undefined {
    if (auditConfig.byteCount === 0) return;
    const itemSize = connectionNodeConfig?.size ?? 0;
    if (itemSize === 0) return formatNumberAsStorageSize(auditConfig.byteCount);
    if (auditConfig.isComplete) return t(TEXT, 'detail.auditedAmount.complete.text', { amount: formatNumberAsStorageSize(itemSize), percentage: formatStatusPercentage(100) });
    const percentage = formatStatusPercentage(Math.min((auditConfig.byteCount / itemSize) * 100, 100));
    return t(TEXT, 'detail.auditedAmount.part.text', {
        amount: formatNumberAsStorageSize(auditConfig.byteCount),
        percentage,
        total: formatNumberAsStorageSize(itemSize)
    });
}

function constructAuditSection(auditConfig: ContentAuditConfig): DetailSection {
    return {
        id: 'audit',
        title: t(TEXT, 'detail.audit.title'),
        details: [
            { labelKey: 'detail.auditedAmount.label', value: constructAuditedAmountText(auditConfig) },
            { labelKey: 'detail.records.label', value: formatCount(auditConfig.recordCount) },
            { labelKey: 'detail.lines.label', value: formatOptionalCount(auditConfig.lineCount) },
            { labelKey: 'detail.emptyLines.label', value: formatOptionalCount(auditConfig.emptyLineCount) },
            { labelKey: 'detail.commentLines.label', value: formatOptionalCount(auditConfig.commentLineCount) },
            { labelKey: 'detail.unevenRecords.label', value: formatOptionalCount(auditConfig.invalidFieldLengthCount) },
            { labelKey: 'detail.duration.label', value: formatFinishedDuration(auditConfig.duration) },
            { labelKey: 'detail.sourceWait.label', value: formatOptionalDuration(auditConfig.sourceWaitDuration) }, // Part of the duration.
            { labelKey: 'detail.parsing.label', value: formatOptionalDuration(auditConfig.parseDuration) }, // Part of the duration.
            { labelKey: 'detail.columnAudit.label', value: formatOptionalDuration(auditConfig.columnAuditDuration) }, // Part of the duration.
            { labelKey: 'detail.other.label', value: formatOptionalDuration(constructAuditOtherDuration(auditConfig)) }, // The rest of the duration.
            { labelKey: 'detail.audited.label', value: formatDateTime(auditConfig.asAt) }
        ]
    };
}

// What is left of an audit's duration once its timed parts are taken off, such as fetching the item before a preview,
// loading the parser and reporting progress. Undefined for an audit whose parts were not timed.
function constructAuditOtherDuration(auditConfig: ContentAuditConfig): number | undefined {
    const { columnAuditDuration, duration, parseDuration, sourceWaitDuration = 0 } = auditConfig;
    return parseDuration == null || columnAuditDuration == null ? undefined : Math.max(0, duration - sourceWaitDuration - parseDuration - columnAuditDuration);
}

// Where the data view's last load spent its time. Waiting, starting and parsing add up to reading, and reading,
// converting, storing and other add up to the duration.
function constructLoadSection(timing: DataViewLoadTiming): DetailSection {
    const parts = constructLoadTimingParts(timing);
    return {
        id: 'load',
        title: t(TEXT, 'detail.load.title'),
        details: [
            { labelKey: 'detail.duration.label', value: formatFinishedDuration(parts.total) },
            { labelKey: 'detail.reading.label', value: formatFinishedDuration(parts.reading) },
            { labelKey: 'detail.sourceWait.label', value: formatOptionalDuration(parts.waiting) }, // Part of reading.
            { labelKey: 'detail.startingRead.label', value: formatOptionalDuration(parts.starting) }, // Part of reading.
            { labelKey: 'detail.parsing.label', value: formatOptionalDuration(parts.parsing) }, // Part of reading.
            { labelKey: 'detail.converting.label', value: formatFinishedDuration(parts.converting) },
            { labelKey: 'detail.storing.label', value: formatFinishedDuration(parts.storing) },
            { labelKey: 'detail.other.label', value: formatFinishedDuration(parts.other) }
        ]
    };
}

function formatCount(count: number): string {
    return formatNumberAsDecimalNumber(count, 0, 0, localeId.value);
}

function formatOptionalCount(count: number | undefined): string | undefined {
    return count == null ? undefined : formatCount(count);
}

function formatOptionalDuration(milliseconds: number | undefined): string | undefined {
    return milliseconds == null ? undefined : formatFinishedDuration(milliseconds);
}

function formatDateTime(timestamp: number): string {
    return new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
}
</script>

<template>
    <StudioDocumentPanel :overline="overline" :title="title" @close="$emit('close')">
        <template v-if="$slots.actions" #actions>
            <slot name="actions" />
        </template>

        <!-- Description ─ First, as what the reader most needs, before where the data comes from. -->
        <div v-if="$slots.description" class="mt-1 mb-3">
            <slot name="description" />
        </div>

        <!-- Source ─ Names the connection, the folder, the item and the store, so the document stands alone, and links to the
             steps that change them. -->
        <DataViewSource
            class="mt-1 mb-4 text-sm"
            :connection-id="connectionId"
            :connection-node-config="connectionNodeConfig"
            :connection-link="connectionStepLink"
            :data-format-id="itemReading?.dataFormatId"
            :data-view-connection="dataViewConnection"
            is-folder-line-shown
            :item-link="itemStepLink"
            :item-type-id="dataViewConnection?.itemTypeId"
            :store="storeLine"
            :store-link="dataStepLink"
        />

        <slot name="intro" />

        <!-- Columns ─ First, as what the reader most needs. The section heading names the table on screen, so its label is
             for screen readers only. -->
        <StudioDocumentSection v-if="itemReading && columnCount > 0" :title="t(TEXT, 'detail.columns.title')">
            <PreviewColumnTable :is-audit-complete="contentAuditConfig?.isComplete === true" :item-reading="itemReading" :row-limit="columnTableIsExpanded ? undefined : COLLAPSED_COLUMN_COUNT" />
            <div v-if="columnCount > COLLAPSED_COLUMN_COUNT" class="mt-2 px-3 text-sm">
                <ActionWrapper :aria-expanded="columnTableIsExpanded" class="text-left text-accent hover:underline" @click="columnTableIsExpanded = !columnTableIsExpanded">
                    {{ columnTableIsExpanded ? t(TEXT, 'column.showFewer.label') : t(TEXT, 'column.showAll.label', { count: columnCount }) }}
                </ActionWrapper>
            </div>
        </StudioDocumentSection>

        <slot name="after-columns" />

        <!-- Item ─ After the columns and data, because it is about where they come from. One section, named for the kind
             of item, with a part each for its details, its reading, its audit and its last load. An item not chosen yet
             keeps the heading and says so in one line, so the document's shape never changes. Every list is laid out the
             same way. A line under every row shows where a value that wraps ends, except under a part's last row. The
             label column is 11rem wide where there is room, so the values line up across the parts. On a narrow screen
             it takes at most 40% of the width, down to 6rem, and long labels and values wrap. -->
        <StudioDocumentSection :title="itemSectionTitle">
            <template v-if="connectionNodeConfig">
                <div v-for="part in shownItemParts" :key="part.id" class="mb-5 last:mb-0">
                    <h3 class="mb-1.5 text-base">{{ part.title }}</h3>
                    <dl
                        class="grid grid-cols-[minmax(6rem,min(11rem,40%))_minmax(0,1fr)] text-sm *:border-b *:border-separator *:py-1 [&>:nth-last-child(-n+2)]:border-b-0 [&>dt]:pr-4 [&>dt]:wrap-break-word"
                    >
                        <template v-for="detail in part.details" :key="detail.labelKey">
                            <dt class="text-muted">{{ t(TEXT, detail.labelKey) }}</dt>
                            <dd class="m-0 min-w-0 wrap-break-word">{{ detail.value }}</dd>
                        </template>
                    </dl>
                </div>
            </template>
            <p v-else class="text-muted">{{ t(TEXT, `${itemSubject}.pending.text`) }}</p>
        </StudioDocumentSection>

        <slot />
    </StudioDocumentPanel>
</template>
