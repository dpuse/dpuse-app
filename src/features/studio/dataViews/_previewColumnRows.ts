// ── External Dependencies & Registrations
import type { Component } from 'vue';

// ── DPUse Framework
import type { ColumnAuditConfig, DataSubtypeId, DataTypeId } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT } from './_previewColumnRows_.json';
import { type ColumnType, constructColumnTypeId, type ItemReading } from './_dataViewColumns';
import { DATA_SUBTYPE_ICONS, DATA_TYPE_ICONS } from './_columnTypeIcons';
import { localeId, t } from '@/state/locale';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ColumnValueCounts {
    blankCount: number;
    invalidCount: number;
    missingCount: number;
    validCount: number;
}

export type PreviewColumnRow = Record<(typeof PREVIEW_COLUMN_KEYS)[number], string>;

export interface PreviewColumnIcons {
    dataSubtypeIcon: Component | undefined; // Undefined when the subtype has no label.
    dataTypeIcon: Component;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The colour of each kind of value, shared by the value bar in a column's header and the chart in its detail, so the
// two always agree.
export const COLUMN_VALUE_SEGMENTS: { colorClass: string; id: keyof ColumnValueCounts }[] = [
    { colorClass: 'bg-[color-mix(in_srgb,var(--color-success-text)_40%,var(--color-card))]', id: 'validCount' },
    { colorClass: 'bg-danger-text', id: 'invalidCount' },
    { colorClass: 'bg-blank-value', id: 'blankCount' },
    { colorClass: 'bg-subtle', id: 'missingCount' }
];

export const PREVIEW_COLUMN_KEYS = [
    'label',
    'dataTypeLabel',
    'dataSubtypeLabel',
    'invalidValueText',
    'blankValueText',
    'missingValueText',
    'uniqueText',
    'readingText',
    'formatText'
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
    countryCode: 'dataSubtype.countryCode.label',
    currencyCode: 'dataSubtype.currencyCode.label',
    date: 'dataSubtype.date.label',
    dateTime: 'dataSubtype.dateTime.label',
    decimal: 'dataSubtype.decimal.label',
    email: 'dataSubtype.email.label',
    hexColor: 'dataSubtype.hexColor.label',
    iban: 'dataSubtype.iban.label',
    integer: 'dataSubtype.integer.label',
    ipRange: 'dataSubtype.ipRange.label',
    ipv4: 'dataSubtype.ipv4.label',
    ipv6: 'dataSubtype.ipv6.label',
    isbn: 'dataSubtype.isbn.label',
    json: 'dataSubtype.json.label',
    languageCode: 'dataSubtype.languageCode.label',
    macAddress: 'dataSubtype.macAddress.label',
    paymentCard: 'dataSubtype.paymentCard.label',
    plain: 'dataSubtype.plain.label',
    time: 'dataSubtype.time.label',
    ulid: 'dataSubtype.ulid.label',
    url: 'dataSubtype.url.label',
    uuid: 'dataSubtype.uuid.label'
};

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function constructDataTypeLabel(dataTypeId: DataTypeId): string {
    return t(TEXT, DATA_TYPE_LABEL_KEYS[dataTypeId]);
}

// The most specific name for a column's type, for where one name stands for its whole type.
export function constructColumnTypeLabel({ dataSubtypeId, dataTypeId }: Pick<ColumnAuditConfig, 'dataSubtypeId' | 'dataTypeId'>): string {
    return dataSubtypeId == null ? constructDataTypeLabel(dataTypeId) : t(TEXT, DATA_SUBTYPE_LABEL_KEYS[dataSubtypeId]);
}

export function constructPreviewColumnHeaders(): PreviewColumnRow {
    return {
        blankValueText: t(TEXT, 'column.blankValues.label'),
        dataSubtypeLabel: t(TEXT, 'column.dataSubtype.label'),
        dataTypeLabel: t(TEXT, 'column.dataType.label'),
        formatText: t(TEXT, 'column.formats.label'),
        invalidValueText: t(TEXT, 'column.invalidValues.label'),
        label: t(TEXT, 'column.label'),
        missingValueText: t(TEXT, 'column.missingValues.label'),
        readingText: t(TEXT, 'column.reading.label'),
        uniqueText: t(TEXT, 'column.unique.label')
    };
}

// One row per column of the preview. The invalid count is the sampled values, the header excluded, that do not fit the
// column's type, as the engine counts them when it chooses. A column with no sampled values has none to count.
export function constructPreviewColumnRows(itemReading: Pick<ItemReading, 'columnConfigs' | 'hasHeaders'>): PreviewColumnRow[] {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return itemReading.columnConfigs.map((columnConfig, index) => {
        const { count, total } = countColumnValues(columnConfig, itemReading.hasHeaders === true);
        return {
            label: constructColumnLabel(columnConfig, index),
            dataTypeLabel: constructDataTypeLabel(columnConfig.dataTypeId),
            dataSubtypeLabel:
                columnConfig.dataSubtypeId === undefined || columnConfig.dataSubtypeId === 'plain' ? '' : t(TEXT, DATA_SUBTYPE_LABEL_KEYS[columnConfig.dataSubtypeId]), // Plain text has no special format, so it gets no subtype label and real subtypes stand out.
            invalidValueText: total === 0 ? '' : numberFormat.format(total - count),
            blankValueText: formatCount(columnConfig.blankValueCount, numberFormat),
            missingValueText: formatCount(columnConfig.missingValueCount, numberFormat),
            uniqueText: formatYesNo(columnConfig.validIsUnique),
            readingText: constructReadingText(columnConfig),
            formatText: formatCounts(columnConfig.validFormats, numberFormat)
        };
    });
}

// A derived column says so, because the item does not hold it.
function constructColumnLabel(columnConfig: ItemReading['columnConfigs'][number], index: number): string {
    const label = columnConfig.label[localeId.value] ?? columnConfig.label.en ?? String(index + 1);
    return columnConfig.derivedFromColumnIndex == null ? label : t(TEXT, 'column.derived.label', { label });
}

// What each column's values are, for the bar in its header. Follows a type the user chose, as the rows do.
export function constructColumnValueCounts(itemReading: ItemReading): ColumnValueCounts[] {
    return itemReading.columnConfigs.map((columnConfig) => {
        const { count, total } = countColumnValues(columnConfig, itemReading.hasHeaders === true);
        return { blankCount: columnConfig.blankValueCount ?? 0, invalidCount: total - count, missingCount: columnConfig.missingValueCount ?? 0, validCount: count };
    });
}

// How many of a column's values do not fit a type the user chose in place of the detected one. A load stores them as
// empty, so they are lost unless the user notices. Text fits any value, so a text type has none.
export function countChosenTypeMisfits(itemReading: Pick<ItemReading, 'columnConfigs' | 'hasHeaders'>, columnIndex: number, detectedColumnType: ColumnType | undefined): number {
    const columnConfig = itemReading.columnConfigs.at(columnIndex);
    if (
        columnConfig == null ||
        detectedColumnType == null ||
        columnConfig.dataTypeId === 'string' ||
        constructColumnTypeId(columnConfig) === constructColumnTypeId(detectedColumnType)
    )
        return 0;
    const { count, total } = countColumnValues(columnConfig, itemReading.hasHeaders === true);
    return total - count;
}

// The icons beside a row's type and subtype labels, kept apart from the rows because the table's cells hold only text.
export function constructPreviewColumnIcons(itemReading: Pick<ItemReading, 'columnConfigs' | 'hasHeaders'>): PreviewColumnIcons[] {
    return itemReading.columnConfigs.map(({ dataSubtypeId, dataTypeId }) => ({
        dataSubtypeIcon: dataSubtypeId === undefined || dataSubtypeId === 'plain' ? undefined : DATA_SUBTYPE_ICONS[dataSubtypeId],
        dataTypeIcon: DATA_TYPE_ICONS[dataTypeId]
    }));
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function formatCount(count: number | undefined, numberFormat: Intl.NumberFormat): string {
    return count == null ? '' : numberFormat.format(count);
}

// Every record has a value that loads. A value that does not fit a type the user chose loads empty, like an invalid one.
export function isColumnComplete(itemReading: Pick<ItemReading, 'columnConfigs' | 'hasHeaders'>, columnIndex: number, detectedColumnType: ColumnType | undefined): boolean {
    return itemReading.columnConfigs.at(columnIndex)?.hasMissingValues === false && countChosenTypeMisfits(itemReading, columnIndex, detectedColumnType) === 0;
}

// A fact the engine could not settle says so, rather than leaving its row out.
export function formatYesNo(isTrue: boolean | undefined): string {
    if (isTrue == null) return t(TEXT, 'answer.unknown.label');
    return t(TEXT, isTrue ? 'answer.yes.label' : 'answer.no.label');
}

// Most frequent first. Counts may be missing from a preview read before they were measured.
function formatCounts(counts: Record<string, number> | undefined, numberFormat: Intl.NumberFormat): string {
    return Object.entries(counts ?? {})
        .toSorted((left, right) => right[1] - left[1])
        .map(([key, count]) => `${key} (${numberFormat.format(count)})`)
        .join(', ');
}

// How values that could be taken two ways are read. It says so when the column's own values did not settle it.
function constructReadingText({ dateOrderId, decimalSeparatorId, formatIssueIds }: ColumnAuditConfig): string {
    const readings: string[] = [];
    if (dateOrderId != null) readings.push(t(TEXT, dateOrderId === 'dayFirst' ? 'reading.dayFirst.text' : 'reading.monthFirst.text'));
    if (decimalSeparatorId != null) readings.push(t(TEXT, decimalSeparatorId === ',' ? 'reading.decimalComma.text' : 'reading.decimalPoint.text'));
    const readingText = readings.join(', ');
    if ((formatIssueIds?.length ?? 0) === 0) return readingText;
    return readingText === '' ? t(TEXT, 'reading.unclearOnly.text') : t(TEXT, 'reading.unclear.text', { reading: readingText }); // A column of mixed currencies, say, has no reading to name.
}

// How many of a column's values fit its current type, of those it holds. A header record's own value is not data.
function countColumnValues(columnConfig: ColumnAuditConfig, hasHeaders: boolean): { count: number; total: number } {
    const sampleCounts = Object.entries(columnConfig.inferenceCounts).map(([inferenceTypeId, count]) => ({
        inferenceTypeId,
        count: hasHeaders ? count - (columnConfig.leadingInferenceCounts[inferenceTypeId] ?? 0) : count
    }));
    const total = sampleCounts.reduce((sum, sampleCount) => sum + sampleCount.count, 0);
    return { count: countColumnMatches(columnConfig.dataTypeId, sampleCounts, total), total };
}

// A full match is just '100%'. The counts are only added below that, so a weak guess stands out.
// A column takes its main type, so every subtype of that type matches. Text fits any value.
function countColumnMatches(dataTypeId: DataTypeId, sampleCounts: { count: number; inferenceTypeId: string }[], total: number): number {
    if (dataTypeId === 'string') return total;
    let matchCount = 0;
    for (const { count, inferenceTypeId } of sampleCounts) if (inferenceTypeId === dataTypeId || inferenceTypeId.startsWith(`${dataTypeId}.`)) matchCount += count;
    return matchCount;
}
