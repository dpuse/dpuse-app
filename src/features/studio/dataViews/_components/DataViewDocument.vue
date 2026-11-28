<script setup lang="ts">
// The document of a data view's item, shown beside the data views on the overview and on the item step's Details tab,
// so both say the same thing in the same words. Each section shows only when it has something to show. The caller
// sets the heading and adds the sections only it has after the shared ones, such as the connector. The document shows
// no records: the sample saved with a data view is not what its store holds, which a load converts and can leave values
// out of, and reading the store for every data view browsed would be too slow. The Explore Data step shows them.

// ── External Dependencies & Registrations
import { computed, ref } from 'vue';
import { type RouteLocationRaw, useRoute } from 'vue-router';

// ── DPUse Framework
import type { ConnectionNodeConfig, ContentAuditConfig, EncodingDetectionConfig, ReadingConfig } from '@dpuse/dpuse-shared';
import { formatNumberAsDecimalNumber, formatNumberAsStorageSize, localiseConfigs } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { isDerivedColumn } from '@/features/studio/dataViews/_state/dataViewColumns';
import { resolveDataViewStore } from '@/features/studio/dataViews/_state/dataViewStore';
import type { SavedItemReading } from '@/features/studio/dataViews/_state/dataViewColumns';
import { TASK_CONFIGS } from '@/features/studio/dataViews/_useDataViewTasks_.json';
import { TEXT } from './DataViewDocument_.json';
import { toolConfigs } from '@/state/configs';
import { constructDataFormatLabel, constructRecordDelimiterLabel, constructValueDelimiterLabel } from './readingLabels';
import { constructLoadTimingParts, type DataViewLoadTiming, findDataViewLoadTiming } from '@/features/studio/dataViews/_state/dataViewStore';
import type { DataViewConnection, DataViewStepId } from '@/features/studio/dataViews/_state/dataViewSummary';
import { formatElapsedDuration, formatFinishedDuration, formatStatusPercentage } from './_statusBar';
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
    to: RouteLocationRaw | undefined; // Undefined for a step that cannot be opened from here, which shows the link disabled.
}

// A part of the item's section and its facts. A fact that is undefined is not known, and shows as 'Unknown'. One that is
// null does not apply to this item, such as a delimiter for a format that has none, and shows as 'Not applicable', muted.
interface DetailSection {
    id: string;
    title: string;
    details: { isMuted?: boolean; labelKey: keyof typeof TEXT; value: string | null | undefined }[];
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
    encodingCandidates,
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
    encodingCandidates?: EncodingDetectionConfig[] | undefined; // Every encoding detection found, best first. Undefined when no text was decoded.
    isLoaded?: boolean; // The records are in the store and still match the columns.
    itemReading: SavedItemReading | undefined; // Undefined until the item has been read.
    overline?: string;
    storeConnectorId?: string | undefined; // Undefined for the default store.
    title: string;
}>();

defineSlots<{
    actions?(): unknown; // Beside the title.
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
// A step that cannot be opened yet has its link disabled, never hidden: an item is chosen from a connection, and the
// records can only be explored once the item has been previewed. The link to the step on screen is disabled too. A new
// data view is not saved yet, so it is named as the route names it.
const linkedDataViewId = computed(() => dataViewId ?? (typeof route.params.dataViewId === 'string' ? route.params.dataViewId : undefined));
const connectionStepLink = computed(() => constructStepLink('connection', 'step.connection.aria', true));
const itemStepLink = computed(() => constructStepLink('item', connectionNodeConfig == null ? 'step.itemSelect.aria' : 'step.itemChange.aria', connectionId != null));
const dataStepLink = computed(() => constructStepLink('data', 'step.data.aria', connectionNodeConfig != null && itemReading != null));

// ── Store ─ Where the records are loaded, and whether they are there yet.
const storeLine = computed(() => ({ ...resolveDataViewStore({ storeConnectorId }), isLoaded }));

// ── Item
const itemIsFile = computed(() => dataViewConnection?.itemTypeId === 'file');
const itemSubject = computed(() => dataViewConnection?.itemTypeId ?? 'item'); // Messages name the connector's kind of item, e.g. 'No file selected yet', and fall back to 'item' when the connection has gone.

// The item's title is shown as a description only when it says more than its name, as a series title does. A file's
// title is its name, so a file shows none.
const itemDescription = computed(() => {
    if (!connectionNodeConfig) return null;
    const name = connectionNodeConfig.extension == null ? connectionNodeConfig.name : `${connectionNodeConfig.name}.${connectionNodeConfig.extension}`;
    return connectionNodeConfig.label === name ? null : connectionNodeConfig.label;
});

// Only a file has a type and a way of being read. A table or an API endpoint has neither.
const itemDetailSection = computed<DetailSection | undefined>(() => {
    if (!connectionNodeConfig) return;
    return {
        id: 'details',
        title: t(TEXT, 'detail.details.title'),
        details: [
            { labelKey: 'detail.description.label', value: itemDescription.value },
            { labelKey: 'detail.fileType.label', value: itemIsFile.value ? (itemReading?.fileType?.mime ?? connectionNodeConfig.mimeType) : null },
            { labelKey: 'detail.size.label', value: connectionNodeConfig.size == null ? undefined : formatNumberAsStorageSize(connectionNodeConfig.size) },
            { labelKey: 'detail.lastModified.label', value: connectionNodeConfig.lastModifiedAt == null ? undefined : formatDateTime(connectionNodeConfig.lastModifiedAt) }
        ]
    };
});

// ── Item Parts ─ What reading, auditing and loading the item found. Reading is for a file, and auditing and loading are
// there once they have happened.
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
    if (itemReading == null) return;
    const count = itemReading.issues.length;
    if (count === 0) return t(TEXT, 'issue.none.text');
    return t(TEXT, count === 1 ? 'issue.one.text' : 'issue.other.text', { count });
});
const loadTiming = computed(() => (dataViewId == null ? undefined : findDataViewLoadTiming(dataViewId)));
const sections = computed(() => {
    const detailSections: DetailSection[] = [];
    if (itemReading && itemIsFile.value) {
        detailSections.push({
            id: 'reading',
            title: t(TEXT, 'detail.reading.title'),
            // In the order a file is read: decoded, recognised, then parsed.
            details: [
                { labelKey: 'detail.encoding.label', value: constructEncodingText(itemReading) },
                { labelKey: 'detail.encodingCandidates.label', value: constructEncodingCandidatesText() },
                {
                    labelKey: 'detail.unreadableCharacters.label',
                    value: itemReading.replacementCharacterCount == null ? undefined : formatCount(itemReading.replacementCharacterCount)
                },
                { labelKey: 'detail.dataFormat.label', value: constructDataFormatText(itemReading) },
                { labelKey: 'detail.parser.label', value: parserLabel.value },
                { labelKey: 'detail.recordDelimiter.label', value: constructRecordDelimiterText(itemReading) },
                { labelKey: 'detail.valueDelimiter.label', value: constructValueDelimiterText(itemReading) },
                { labelKey: 'detail.hasHeaders.label', value: constructHeadersText(itemReading) },
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

// ── Item Section ─ The item's details, how it was read, what the audit found and the last load, as parts of one section
// about the item. Every fact is listed, and one that does not apply or is not known says so, because a missing row
// reads as "not there".
const itemSectionTitle = computed(() => dataViewConnection?.itemTypeLabel ?? t(TEXT, 'item.title'));
const shownItemParts = computed(() =>
    [itemDetailSection.value, ...sections.value]
        .filter((section) => section != null)
        .map((section) => resolveShownDetails(section))
        .filter((section) => section.details.length > 0)
);

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The link shows the step's number from the task bar, so the reader can find the step there too.
function constructStepLink(stepId: DataViewStepId, labelKey: keyof typeof TEXT, canBeOpened: boolean): StepLink {
    const stepNumber = assertDefined(TASK_CONFIGS.find((taskConfig) => taskConfig.id === stepId)).number;
    const isLinked = canBeOpened && stepId !== currentStepId && linkedDataViewId.value != null;
    const to: RouteLocationRaw | undefined = isLinked ? { name: stepId, params: { dataViewId: linkedDataViewId.value }, query: route.query } : undefined;
    return { label: t(TEXT, labelKey, { number: String(stepNumber) }), stepNumber, to };
}

// Every fact keeps its row, so the list is the same for every item. One that does not apply says so, muted, and one
// that is not known says that.
function resolveShownDetails(section: DetailSection): DetailSection {
    const details = section.details.map((detail) => {
        if (detail.value === null) return { ...detail, isMuted: true, value: t(TEXT, 'detail.notApplicable.text') };
        return { ...detail, value: detail.value == null || detail.value === '' ? t(TEXT, 'detail.unknown.text') : detail.value };
    });
    return { ...section, details };
}

// The encoding the sample was decoded with, and why: the user's choice, or how detection found it. A chosen encoding the
// browser cannot decode is named, because the text was decoded as UTF-8 instead.
function constructEncodingText(reading: SavedItemReading): string | undefined {
    const encoding = reading.decodedEncodingId ?? reading.encodingId;
    if (encoding == null) return;
    if (chosenEncodingId != null && chosenEncodingId !== encoding) return t(TEXT, 'detail.encoding.undecodable.text', { encoding: chosenEncodingId });
    const sourceText =
        chosenEncodingId == null
            ? constructEncodingSourceText(detectedReadingConfig?.encodingSourceId, detectedReadingConfig?.encodingConfidenceLevel)
            : t(TEXT, 'encodingSource.choice.text');
    return sourceText == null ? encoding : t(TEXT, 'detail.sourced.text', { source: sourceText, value: encoding });
}

// Every encoding detection found, best first, each with how sure it was. An item whose encoding was not detected, such
// as XML, which states its own, has none, so the row does not apply. Text that is all ASCII has none to tell apart.
function constructEncodingCandidatesText(): string | null {
    if (encodingCandidates == null) return null;
    if (encodingCandidates.length === 0) return t(TEXT, 'detail.encodingCandidates.none.text');
    const percentFormat = new Intl.NumberFormat(localeId.value, { style: 'percent', maximumFractionDigits: 0 });
    const candidateTexts = encodingCandidates.map(({ confidenceLevel, id }) =>
        confidenceLevel == null ? id : t(TEXT, 'detail.encodingCandidates.candidate.text', { confidence: percentFormat.format(confidenceLevel), encoding: id })
    );
    return new Intl.ListFormat(localeId.value, { style: 'short', type: 'unit' }).format(candidateTexts);
}

function constructEncodingSourceText(encodingSourceId: ReadingConfig['encodingSourceId'], confidenceLevel: number | undefined): string | undefined {
    if (encodingSourceId == null) return;
    if (encodingSourceId !== 'detection' || confidenceLevel == null) return t(TEXT, `encodingSource.${encodingSourceId}.text`);
    const confidence = new Intl.NumberFormat(localeId.value, { style: 'percent', maximumFractionDigits: 0 }).format(confidenceLevel);
    return t(TEXT, 'encodingSource.detection.text', { confidence });
}

// A file recognised as something other than data, such as a PDF or an image, has no format, so the type the preview
// detected names it instead. A container type names it by the item's extension, so a legacy Excel file reads 'XLS'.
function constructDataFormatText({ dataFormatId, fileType }: SavedItemReading): string {
    if (fileType == null || dataFormatId !== 'unknown') return constructDataFormatLabel(dataFormatId);
    const itemExtension = connectionNodeConfig?.extension;
    const isNamedByItem = itemExtension != null && itemExtension !== '' && CONTAINER_FILE_TYPE_EXTENSIONS.has(fileType.ext);
    return (isNamedByItem ? itemExtension : fileType.ext).toUpperCase();
}

// Headers and delimiters only apply to delimited text. There they always show, and a parse that found none says so.
function constructHeadersText({ dataFormatId, hasHeaders }: SavedItemReading): string | null {
    if (dataFormatId !== 'dtv') return null;
    if (hasHeaders == null) return t(TEXT, 'detail.notDetected.text');
    return t(TEXT, hasHeaders ? 'detail.hasHeaders.yes.text' : 'detail.hasHeaders.no.text');
}

function constructRecordDelimiterText({ dataFormatId, recordDelimiterId }: SavedItemReading): string | null {
    if (dataFormatId !== 'dtv') return null;
    return recordDelimiterId == null ? t(TEXT, 'detail.notDetected.text') : constructRecordDelimiterLabel(recordDelimiterId);
}

function constructValueDelimiterText({ dataFormatId, valueDelimiterId }: SavedItemReading): string | null {
    if (dataFormatId !== 'dtv') return null;
    return valueDelimiterId == null ? t(TEXT, 'detail.notDetected.text') : constructValueDelimiterLabel(valueDelimiterId);
}

// How much of the item the audit read, and what share of the item that is when its size is known. An item not read as
// bytes, such as a table, has no amount.
function constructAuditedAmountText(auditConfig: ContentAuditConfig): string | null {
    if (auditConfig.byteCount === 0) return null;
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

// How many of the item's lines are its header row: one or none. Only delimited text has one, and it is not known until
// the item has been read.
function constructHeaderRowCountText(): string | null | undefined {
    if (itemReading == null) return;
    if (itemReading.dataFormatId !== 'dtv') return null;
    return itemReading.hasHeaders == null ? undefined : formatCount(itemReading.hasHeaders ? 1 : 0);
}

function constructAuditSection(auditConfig: ContentAuditConfig): DetailSection {
    return {
        id: 'audit',
        title: t(TEXT, 'detail.audit.title'),
        details: [
            { labelKey: 'detail.auditedAmount.label', value: constructAuditedAmountText(auditConfig) },
            // The lines, then what they are made of, so the reader sees why there are more lines than records without
            // looking up the headers setting. A quoted value over several lines is one record, so the parts need not add
            // up to the lines.
            { labelKey: 'detail.lines.label', value: formatOptionalCount(auditConfig.lineCount) },
            { labelKey: 'detail.headerRows.label', value: constructHeaderRowCountText() },
            { labelKey: 'detail.records.label', value: formatCount(auditConfig.recordCount) },
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

// A part of an audit's or a load's time that was not timed apart took none of its own, so it shows as zero: an item's
// first audit has no wait, because its bytes were fetched before it started, and a source that holds typed values has
// no parser. A plain zero, because 'formatFinishedDuration' shows a zero as a time too short to show.
function formatOptionalDuration(milliseconds: number | undefined): string {
    return milliseconds == null ? formatElapsedDuration(0) : formatFinishedDuration(milliseconds);
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

        <!-- Item ─ After the columns, because it is about where they come from. One section, named for the kind
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
                            <dd class="m-0 min-w-0 wrap-break-word" :class="{ 'text-muted': detail.isMuted }">{{ detail.value }}</dd>
                        </template>
                    </dl>
                </div>
            </template>
            <p v-else class="text-muted">{{ t(TEXT, `${itemSubject}.pending.text`) }}</p>
        </StudioDocumentSection>

        <slot />
    </StudioDocumentPanel>
</template>
