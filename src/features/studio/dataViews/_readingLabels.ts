// ── DPUse Framework
import type { DataFormatId, RecordDelimiterId, ValueDelimiterId } from '@dpuse/dpuse-shared';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './_readingLabels_.json';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

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

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function constructDataFormatLabel(dataFormatId: DataFormatId): string {
    return t(TEXT, DATA_FORMAT_LABEL_KEYS[dataFormatId]);
}

export function constructRecordDelimiterLabel(recordDelimiterId: RecordDelimiterId): string {
    return t(TEXT, RECORD_DELIMITER_LABEL_KEYS[recordDelimiterId]);
}

export function constructValueDelimiterLabel(valueDelimiterId: ValueDelimiterId): string {
    return t(TEXT, VALUE_DELIMITER_LABEL_KEYS[valueDelimiterId]);
}
