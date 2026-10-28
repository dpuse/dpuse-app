<script setup lang="ts">
// ── External Dependencies & Registrations
import type { ColumnDef } from '@tanstack/vue-table';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { DataSubtypeId, ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { raiseAppFailure } from '@/state/errors';
import { retrieveDataViewRecordRange } from '@/services/metaStore';
import { TEXT } from './InvestigateDataPanel_.json';
import { localeId, t } from '@/state/locale';
import { resolveDataViewIdParameter, useDataView } from '@/features/studio/dataViews/_dataViews';

// ── Static Components
import Table from '@/components/ui/table/Table.vue';
import type { TableFeatureSet } from '@/components/ui/table/tableFeatures';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type StoredRecord = Record<string, unknown>; // Keyed by column position, 'c1' first, as the audit stored it.
type DisplayRow = Record<string, string>; // The same keys, each value as the text the table shows.

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// A date shows its time only where the audited column holds one. A date in a column of another type shows both.
const DATE_FORMAT_OPTIONS: Partial<Record<DataSubtypeId, Intl.DateTimeFormatOptions>> = {
    date: { dateStyle: 'medium' },
    time: { timeStyle: 'medium' }
};
const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'medium' };

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

// ── Data View
const { data: dataViewConfig } = useDataView(() => resolveDataViewIdParameter(route.params.dataViewId));
const auditedColumnConfigs = computed(() => dataViewConfig.value?.contentAuditConfig?.columns ?? []);

// ── Table ─ One column for each audited column, named as the audit named it.
const columnDefinitions = computed<ColumnDef<TableFeatureSet, DisplayRow>[]>(() =>
    auditedColumnConfigs.value.map((columnConfig, index) => ({
        accessorKey: constructColumnKey(index),
        header: columnConfig.label[localeId.value] ?? columnConfig.label.en ?? String(index + 1),
        size: 160
    }))
);

// The records are read a block at a time as the table scrolls. A new audit replaces them, so its time is in the
// source's id, and the table drops the blocks it holds.
const dataSource = computed<DataSource<DisplayRow>>(() => {
    const dataViewId = dataViewConfig.value?.id;
    return {
        id: `${dataViewId ?? ''}|${String(dataViewConfig.value?.contentAuditConfig?.asAt ?? '')}`,
        rowCount: undefined,
        getRows: async (startRow: number, endRow: number): Promise<{ rows: DisplayRow[]; totalCount: number }> => {
            if (dataViewId == null) return { rows: [], totalCount: 0 };
            try {
                const { records, totalCount } = await retrieveDataViewRecordRange(dataViewId, { limit: endRow - startRow, offset: startRow });
                return { rows: records.map((storedRecord) => constructDisplayRow(storedRecord)), totalCount };
            } catch (error) {
                raiseAppFailure(new AppError("Failed to read the data view's records.", 'dpuse-app.InvestigateDataPanel', { typeId: 'handled' }, { cause: error }));
                return { rows: [], totalCount: 0 };
            }
        }
    };
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructColumnKey(columnIndex: number): string {
    return `c${String(columnIndex + 1)}`;
}

function constructDisplayRow(storedRecord: StoredRecord): DisplayRow {
    const displayRow: DisplayRow = {};
    for (const [columnIndex, columnConfig] of auditedColumnConfigs.value.entries()) {
        const key = constructColumnKey(columnIndex);
        displayRow[key] = formatStoredValue(storedRecord[key], columnConfig);
    }
    return displayRow;
}

// Each value was stored as its own type, so a date is formatted for the locale and anything else shows as itself.
function formatStoredValue(value: unknown, columnConfig: ObjectColumnConfig): string {
    if (value == null) return '';
    if (value instanceof Date) {
        const { dataSubtypeId } = columnConfig;
        const formatOptions = dataSubtypeId != null && columnConfig.dataTypeId === 'temporal' ? DATE_FORMAT_OPTIONS[dataSubtypeId] : undefined;
        return new Intl.DateTimeFormat(localeId.value, formatOptions ?? DATE_TIME_FORMAT_OPTIONS).format(value);
    }
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
}
</script>

<template>
    <div class="flex min-h-0 flex-1 flex-col" data-region="InvestigateDataPanel">
        <!-- The usual room after the last row, less the status bar's height: the table already ends above it. -->
        <Table
            v-if="auditedColumnConfigs.length > 0"
            class="flex-1"
            :column-definitions="columnDefinitions"
            :data-source="dataSource"
            scroll-area-padding-bottom="calc(var(--vertical-scroll-bottom-screen-inset) - var(--status-bar-height))"
        />
        <p v-else class="m-auto px-4 text-center text-sm text-muted">{{ t(TEXT, 'audit.required.text') }}</p>

        <!-- Status Bar ─ Blank for now. Keeps the table, and its horizontal scroll bar, above the bottom safe area on
             iOS, as the item preview's status bar does. -->
        <div class="h-(--status-bar-height) w-full flex-none border-t border-separator bg-card" />
    </div>
</template>
