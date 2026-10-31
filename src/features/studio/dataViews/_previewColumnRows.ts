// ── External Dependencies & Registrations
import type { Component } from 'vue';

// ── DPUse Framework
import type { DataSubtypeId, DataTypeId, ObjectColumnConfig, PreviewConfig, StorageTypeId } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT } from './_previewColumnRows_.json';
import { DATA_SUBTYPE_ICONS, DATA_TYPE_ICONS } from './_columnTypeIcons';
import { localeId, t } from '@/state/locale';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type PreviewColumnRow = Record<(typeof PREVIEW_COLUMN_KEYS)[number], string>;

export interface PreviewColumnIcons {
    dataSubtypeIcon: Component | undefined; // Undefined when the subtype has no label.
    dataTypeIcon: Component;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const PREVIEW_COLUMN_KEYS = [
    'label',
    'dataTypeLabel',
    'dataSubtypeLabel',
    'matchText',
    'validValueText',
    'invalidValueText',
    'blankValueText',
    'missingValueText',
    'requiredText',
    'uniqueText',
    'distinctValueText',
    'minValueText',
    'maxValueText',
    'sizeText',
    'wholeDigitText',
    'decimalText',
    'storageTypeLabel',
    'readingText',
    'formatText',
    'typeCountText',
    'frequentValueText',
    'quotedValueText',
    'paddedValueText',
    'validSampleText',
    'invalidSampleText'
] as const;

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

const STORAGE_TYPE_LABEL_KEYS: Record<StorageTypeId, keyof typeof TEXT> = {
    binary: 'storageType.binary.label',
    boolean: 'storageType.boolean.label',
    byte: 'storageType.byte.label',
    date: 'storageType.date.label',
    dateTime: 'storageType.dateTime.label',
    dateTimeOffset: 'storageType.dateTimeOffset.label',
    decimal: 'storageType.decimal.label',
    double: 'storageType.double.label',
    int8: 'storageType.int8.label',
    int16: 'storageType.int16.label',
    int32: 'storageType.int32.label',
    int64: 'storageType.int64.label',
    object: 'storageType.object.label',
    single: 'storageType.single.label',
    string: 'storageType.string.label',
    time: 'storageType.time.label',
    unknown: 'storageType.unknown.label'
};

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function constructDataTypeLabel(dataTypeId: DataTypeId): string {
    return t(TEXT, DATA_TYPE_LABEL_KEYS[dataTypeId]);
}

export function constructPreviewColumnHeaders(): PreviewColumnRow {
    return {
        blankValueText: t(TEXT, 'column.blankValues.label'),
        dataSubtypeLabel: t(TEXT, 'column.dataSubtype.label'),
        dataTypeLabel: t(TEXT, 'column.dataType.label'),
        decimalText: t(TEXT, 'column.decimals.label'),
        distinctValueText: t(TEXT, 'column.distinctValues.label'),
        formatText: t(TEXT, 'column.formats.label'),
        frequentValueText: t(TEXT, 'column.frequentValues.label'),
        invalidSampleText: t(TEXT, 'column.invalidSamples.label'),
        invalidValueText: t(TEXT, 'column.invalidValues.label'),
        label: t(TEXT, 'column.label'),
        matchText: t(TEXT, 'column.match.label'),
        maxValueText: t(TEXT, 'column.maxValue.label'),
        minValueText: t(TEXT, 'column.minValue.label'),
        missingValueText: t(TEXT, 'column.missingValues.label'),
        paddedValueText: t(TEXT, 'column.paddedValues.label'),
        quotedValueText: t(TEXT, 'column.quotedValues.label'),
        readingText: t(TEXT, 'column.reading.label'),
        requiredText: t(TEXT, 'column.required.label'),
        sizeText: t(TEXT, 'column.size.label'),
        storageTypeLabel: t(TEXT, 'column.storageType.label'),
        typeCountText: t(TEXT, 'column.typeCounts.label'),
        uniqueText: t(TEXT, 'column.unique.label'),
        validSampleText: t(TEXT, 'column.validSamples.label'),
        validValueText: t(TEXT, 'column.validValues.label'),
        wholeDigitText: t(TEXT, 'column.wholeDigits.label')
    };
}

// One row per column of the preview. The match is the share of sampled values, the header excluded, that fitted the
// column's type, as the engine counts it when it chooses.
export function constructPreviewColumnRows(previewConfig: PreviewConfig): PreviewColumnRow[] {
    const percentFormat = new Intl.NumberFormat(localeId.value, { style: 'percent', maximumFractionDigits: 0 });
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return previewConfig.columnConfigs.map((columnConfig, index) => {
        const sampleCounts = Object.entries(columnConfig.inferenceCounts).map(([inferenceTypeId, count]) => ({
            inferenceTypeId,
            count: previewConfig.hasHeaders === true ? count - (columnConfig.leadingInferenceCounts[inferenceTypeId] ?? 0) : count
        }));
        const total = sampleCounts.reduce((sum, sampleCount) => sum + sampleCount.count, 0);
        const count = countColumnMatches(columnConfig.dataTypeId, sampleCounts, total);
        return {
            label: columnConfig.label[localeId.value] ?? columnConfig.label.en ?? String(index + 1),
            dataTypeLabel: constructDataTypeLabel(columnConfig.dataTypeId),
            dataSubtypeLabel:
                columnConfig.dataSubtypeId === undefined || columnConfig.dataSubtypeId === 'plain' ? '' : t(TEXT, DATA_SUBTYPE_LABEL_KEYS[columnConfig.dataSubtypeId]), // Plain text has no special format, so it gets no subtype label and real subtypes stand out.
            matchText: formatMatchText(count, total, percentFormat),
            validValueText: formatCount(count, numberFormat), // From the column's current type, so it follows a type the user chose, as the match does.
            invalidValueText: formatCount(total - count, numberFormat),
            blankValueText: formatCount(columnConfig.blankValueCount, numberFormat),
            missingValueText: formatCount(columnConfig.missingValueCount, numberFormat),
            requiredText: formatYesNo(columnConfig.isRequired),
            uniqueText: formatYesNo(columnConfig.isUnique),
            distinctValueText: formatDistinctValues(columnConfig, numberFormat),
            minValueText: columnConfig.minValue ?? '',
            maxValueText: columnConfig.maxValue ?? '',
            sizeText: formatRange(columnConfig.minSize, columnConfig.maxSize, numberFormat),
            wholeDigitText: formatRange(columnConfig.minWholeDigits, columnConfig.maxWholeDigits, numberFormat),
            decimalText: formatRange(columnConfig.minDecimals, columnConfig.maxDecimals, numberFormat),
            storageTypeLabel: columnConfig.storageTypeId == null ? '' : t(TEXT, STORAGE_TYPE_LABEL_KEYS[columnConfig.storageTypeId]),
            readingText: constructReadingText(columnConfig),
            formatText: formatCounts(columnConfig.formats, numberFormat),
            typeCountText: formatCounts(columnConfig.inferenceCounts, numberFormat),
            frequentValueText: formatCounts(columnConfig.frequentValues, numberFormat),
            quotedValueText: formatCount(columnConfig.quotedValueCount, numberFormat),
            paddedValueText: formatCount(columnConfig.paddedValueCount, numberFormat),
            validSampleText: formatSamples(columnConfig.validValues),
            invalidSampleText: formatSamples(columnConfig.invalidValues)
        };
    });
}

// The icons beside a row's type and subtype labels, kept apart from the rows because the table's cells hold only text.
export function constructPreviewColumnIcons(previewConfig: PreviewConfig): PreviewColumnIcons[] {
    return previewConfig.columnConfigs.map(({ dataSubtypeId, dataTypeId }) => ({
        dataSubtypeIcon: dataSubtypeId === undefined || dataSubtypeId === 'plain' ? undefined : DATA_SUBTYPE_ICONS[dataSubtypeId],
        dataTypeIcon: DATA_TYPE_ICONS[dataTypeId]
    }));
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function formatCount(count: number | undefined, numberFormat: Intl.NumberFormat): string {
    return count == null ? '' : numberFormat.format(count);
}

function formatYesNo(isTrue: boolean | undefined): string {
    if (isTrue == null) return '';
    return t(TEXT, isTrue ? 'answer.yes.label' : 'answer.no.label');
}

// A preview read before these items were measured has none of them. A column that has them but no distinct count held
// too many values to count.
function formatDistinctValues({ distinctValueCount, quotedValueCount }: ObjectColumnConfig, numberFormat: Intl.NumberFormat): string {
    if (distinctValueCount != null) return numberFormat.format(distinctValueCount);
    return quotedValueCount == null ? '' : t(TEXT, 'distinctValues.notCounted.text');
}

function formatRange(minimum: number | undefined, maximum: number | undefined, numberFormat: Intl.NumberFormat): string {
    if (minimum == null || maximum == null) return '';
    return minimum === maximum ? numberFormat.format(minimum) : t(TEXT, 'range.text', { minimum: numberFormat.format(minimum), maximum: numberFormat.format(maximum) });
}

// Most frequent first. Counts may be missing from a preview read before they were measured.
function formatCounts(counts: Record<string, number> | undefined, numberFormat: Intl.NumberFormat): string {
    return Object.entries(counts ?? {})
        .toSorted((left, right) => right[1] - left[1])
        .map(([key, count]) => `${key} (${numberFormat.format(count)})`)
        .join(', ');
}

function formatSamples(samples: Record<string, string> | undefined): string {
    return Object.keys(samples ?? {}).join(', ');
}

// How values that could be taken two ways are read. It says so when the column's own values did not settle it.
function constructReadingText({ dateOrderId, decimalSeparatorId, isFormatAmbiguous }: ObjectColumnConfig): string {
    const readings: string[] = [];
    if (dateOrderId != null) readings.push(t(TEXT, dateOrderId === 'dayFirst' ? 'reading.dayFirst.text' : 'reading.monthFirst.text'));
    if (decimalSeparatorId != null) readings.push(t(TEXT, decimalSeparatorId === ',' ? 'reading.decimalComma.text' : 'reading.decimalPoint.text'));
    const readingText = readings.join(', ');
    return isFormatAmbiguous === true ? t(TEXT, 'reading.unclear.text', { reading: readingText }) : readingText;
}

// A full match is just '100%'. The counts are only added below that, so a weak guess stands out.
// A column takes its main type, so every subtype of that type matches. Text fits any value.
function countColumnMatches(dataTypeId: DataTypeId, sampleCounts: { count: number; inferenceTypeId: string }[], total: number): number {
    if (dataTypeId === 'string') return total;
    let matchCount = 0;
    for (const { count, inferenceTypeId } of sampleCounts) if (inferenceTypeId === dataTypeId || inferenceTypeId.startsWith(`${dataTypeId}.`)) matchCount += count;
    return matchCount;
}

function formatMatchText(count: number, total: number, percentFormat: Intl.NumberFormat): string {
    if (total === 0) return '';
    const percent = percentFormat.format(count / total);
    return count === total ? percent : t(TEXT, 'column.match.text', { percent, count, total });
}
