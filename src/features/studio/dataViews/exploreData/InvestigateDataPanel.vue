<script setup lang="ts">
// ── External Dependencies & Registrations
import type { ColumnDef } from '@tanstack/vue-table';
import { RefreshCwIcon } from '@lucide/vue';
import { useRoute } from 'vue-router';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { DataSubtypeId, ObjectColumnConfig, StoreRecord, StoreValue } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import type { DataSource } from '@/composables/useDataWindow';
import { TEXT } from './InvestigateDataPanel_.json';
import { useCurrentDataView } from '@/features/studio/dataViews/_dataViews';
import {
    abortDataViewRecordLoad,
    closeDataViewStore,
    findDataViewStoreLabel,
    hasDataViewLoad,
    isDataViewLoaded,
    loadDataViewRecords,
    openDataViewStore,
    queryDataViewRecords,
    resolveDataViewTablePath
} from '@/features/studio/dataViews/_dataViewStore';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';
import { constructColumnSetVersion, constructDataTypeCellClass, constructLoadColumnConfigs, isEmptyUnitColumn } from '@/features/studio/dataViews/_dataViewColumns';
import { constructFittedColumnWidth, HEADER_MENU_WIDTH_PX } from '@/components/ui/table/tableColumnWidth';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import BusyBar from '@/components/ui/BusyBar.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import Table from '@/components/ui/table/Table.vue';
import type { TableFeatureSet } from '@/components/ui/table/tableFeatures';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Where investigating the data view has got to. 'heldElsewhere' and 'unavailable' come from the store as it opens.
type InvestigateState =
    | { typeId: 'columnsChanged' }
    | { typeId: 'columnsRequired' }
    | { typeId: 'failed'; failure: AppFailure }
    | { typeId: 'heldElsewhere' }
    | { typeId: 'loading' }
    | { typeId: 'notLoaded' }
    | { typeId: 'opening' }
    | { typeId: 'ready' }
    | { typeId: 'stopped' }
    | { typeId: 'unavailable' };

type DisplayRow = Record<string, string>; // Keyed by column position, 'c0' first, each value as the text the table shows. A number's unit is under 'u' and its position, such as 'u0'.

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// A date shows its time only where the audited column holds one. Dates are stored in UTC and shown in UTC, because a date
// with no time zone in the file would otherwise show as the day before for anyone west of Greenwich.
const DATE_FORMAT_OPTIONS: Partial<Record<DataSubtypeId, Intl.DateTimeFormatOptions>> = {
    date: { dateStyle: 'medium', timeZone: 'UTC' },
    time: { timeStyle: 'medium', timeZone: 'UTC' }
};
const COLUMN_WIDTH_PX = 160; // Until the first records arrive.
const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' };
const MAX_FRACTION_DIGITS = 20;

// The messages for states that show only text, centred in the panel.
const MESSAGE_KEYS: Partial<Record<InvestigateState['typeId'], keyof typeof TEXT>> = {
    columnsChanged: 'columns.changed.text',
    columnsRequired: 'columns.required.text',
    heldElsewhere: 'store.heldElsewhere.text',
    notLoaded: 'load.required.text',
    stopped: 'load.stopped.text',
    unavailable: 'store.unavailable.text'
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

// ── Data View
const { data: dataViewConfig, draftIsCurrent } = useCurrentDataView(() => route.params.dataViewId);
const columnsAreFromPartialAudit = computed(() => dataViewConfig.value?.contentAuditConfig?.isComplete === false);
const columnConfigs = computed(() =>
    constructLoadColumnConfigs({ columnSetConfig: dataViewConfig.value?.columnSetConfig, contentAuditConfig: dataViewConfig.value?.contentAuditConfig })
);

// ── Store
const investigateState = shallowRef<InvestigateState>({ typeId: 'opening' });
const loadDuration = ref<number>(); // How long this panel's last finished load took, in milliseconds. A load from an earlier visit has none.
const loadedRecordCount = ref(0);
const loadIsAbandoned = ref(false); // Set on leaving the panel, so the stopped load is not shown as a failure.
const loadIsStopped = ref(false); // Set by 'Stop', so the stopped load is shown as stopped, not as a failure.
const loadVersion = ref(0); // Counts loads, so the table drops the records it holds after each one.
const firstPageColumnWidths = shallowRef<{ dataSourceId: string; widths: number[] }>(); // Measured once per load, so scrolling back cannot move the columns.
const invalidValueCounts = shallowRef<number[]>([]); // From this panel's last finished load. A load from an earlier visit has none.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const messageKey = computed(() => {
    return investigateState.value.typeId === 'notLoaded' && hasEarlierLoad.value ? 'load.changed.text' : MESSAGE_KEYS[investigateState.value.typeId];
});
const hasEarlierLoad = computed(() => dataViewConfig.value != null && hasDataViewLoad(dataViewConfig.value.id, draftIsCurrent.value));
const messageActionKey = computed(() => {
    if (investigateState.value.typeId !== 'notLoaded') return 'retry.label';
    return hasEarlierLoad.value ? 'load.again.label' : 'load.data.label';
});

// ── Mismatches ─ Each column with values that did not fit its type. They loaded as blank, and the type may be a guess from
// a sample or a choice the user got wrong, so they are shown with a way back to the columns.
const invalidValueItems = computed(() =>
    columnConfigs.value
        .map((columnConfig, index) => ({
            count: invalidValueCounts.value[index] ?? 0,
            id: String(index),
            label: columnConfig.label[localeId.value] ?? columnConfig.label.en ?? String(index + 1)
        }))
        .filter((item) => item.count > 0)
);

const loadPendingText = computed(() => t(TEXT, 'load.pending.text', { count: new Intl.NumberFormat(localeId.value).format(loadedRecordCount.value) }));

const loadDurationText = computed(() => {
    if (loadDuration.value == null) return '';
    // One decimal place, with more only for a time too short to show in one, so a quick load does not read as 0.
    const seconds = new Intl.NumberFormat(localeId.value, {
        maximumFractionDigits: 1,
        maximumSignificantDigits: 1,
        minimumFractionDigits: 1,
        minimumSignificantDigits: 1,
        roundingPriority: 'morePrecision'
    }).format(loadDuration.value / 1000);
    return t(TEXT, 'load.duration.text', { seconds, store: findDataViewStoreLabel() });
});

// ── Table ─ One column for each of the data view's columns.
const columnDefinitions = computed<ColumnDef<TableFeatureSet, DisplayRow>[]>(() =>
    columnConfigs.value.map((columnConfig, index) => ({
        accessorKey: constructColumnKey(index),
        header: columnConfig.label[localeId.value] ?? columnConfig.label.en ?? String(index + 1),
        size: firstPageColumnWidths.value?.widths[index] ?? COLUMN_WIDTH_PX
    }))
);

// Unit columns that found no unit start hidden, and the column picker shows them.
const hiddenColumnIds = computed(() =>
    columnConfigs.value.map((columnConfig, index) => (isEmptyUnitColumn(columnConfig) ? constructColumnKey(index) : undefined)).filter((columnId) => columnId !== undefined)
);

// The records are read a block at a time as the table scrolls.
const dataSource = computed<DataSource<DisplayRow>>(() => {
    const dataViewId = dataViewConfig.value?.id;
    const tablePath = dataViewId == null ? undefined : resolveDataViewTablePath(dataViewId, draftIsCurrent.value);
    const dataSourceId = `${tablePath ?? ''}|${String(loadVersion.value)}`;
    return {
        id: dataSourceId,
        rowCount: undefined,
        getRows: async (startRow: number, endRow: number): Promise<{ rows: DisplayRow[]; totalCount: number }> => {
            if (tablePath == null) return { rows: [], totalCount: 0 };
            try {
                const query = { aggregates: [], filters: [], groupColumnIndexes: [], limit: endRow - startRow, offset: startRow, sorts: [] };
                const { records, totalCount } = await queryDataViewRecords(tablePath, query);
                const rows = records.map((storeRecord) => constructDisplayRow(storeRecord));
                if (startRow === 0) fitColumnsToFirstPage(dataSourceId, rows);
                return { rows, totalCount };
            } catch (error) {
                raiseAppFailure(new AppError("Failed to read the data view's records.", 'dpuse-app.InvestigateDataPanel', { typeId: 'handled' }, { cause: error }));
                return { rows: [], totalCount: 0 };
            }
        }
    };
});

// ── Units ─ A column of numbers shows each number's unit in its cell, in the accounting layout: a currency at the
// cell's left edge, the number on the right with its decimal point lined up, and a percent sign after it. The unit
// comes from the column worked out from the numbers, so the number itself can stay a number that sorts and adds up. A
// column with any percentage keeps room for the sign on every row, so the decimal points still line up.
const unitColumnIndexes = computed(() => {
    const indexes = new Map<number, number>();
    for (const [index, columnConfig] of columnConfigs.value.entries()) {
        const isUnitColumn = columnConfig.derivationId === 'unit' || columnConfig.derivationId === 'currency';
        if (isUnitColumn && columnConfig.derivedFromColumnIndex != null) indexes.set(columnConfig.derivedFromColumnIndex, index);
    }
    return indexes;
});
const percentageColumnIndexes = computed(
    () =>
        new Set(
            [...unitColumnIndexes.value]
                .filter(([, unitIndex]) => (columnConfigs.value[unitIndex]?.formats['%'] ?? 0) > 0)
                .map(([sourceIndex]) => sourceIndex)
        )
);

// ── Number Formats ─ One for each column. Every number shows at least its column's most decimals, so the decimal points
// line up. The maximum is high because a partial audit can miss a longer value, which must never be rounded. No grouping,
// because a number can be an id.
const numberFormats = computed(() =>
    columnConfigs.value.map((columnConfig) => {
        const minimumFractionDigits = columnConfig.maxDecimals ?? 0;
        return new Intl.NumberFormat(localeId.value, { maximumFractionDigits: Math.max(minimumFractionDigits, MAX_FRACTION_DIGITS), minimumFractionDigits, useGrouping: false });
    })
);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Opens the store once the data view has columns, and again when they change, which needs a new load.
watch(
    () => constructColumnSetVersion(dataViewConfig.value?.columnSetConfig),
    (columnSetVersion) => {
        if (columnSetVersion == null) investigateState.value = { typeId: 'columnsRequired' };
        else if (wasLoadRequested() || isDataViewLoaded(assertDefined(dataViewConfig.value), draftIsCurrent.value)) void openAndLoad(false);
        else investigateState.value = { typeId: 'notLoaded' };
    },
    { immediate: true }
);

// Leaving stops a load rather than letting it run on unseen, and closes the store so another tab can use it.
onBeforeUnmount(() => {
    const leftDataViewConfig = dataViewConfig.value;
    if (leftDataViewConfig != null && investigateState.value.typeId === 'loading') {
        loadIsAbandoned.value = true;
        void abortDataViewRecordLoad(leftDataViewConfig).catch((error: unknown) => {
            raiseFailure(new AppError('Failed to stop loading the records.', 'dpuse-app.InvestigateDataPanel', { typeId: 'handled' }, { cause: error }));
        });
    }
    void closeDataViewStore().catch((error: unknown) => {
        raiseFailure(new AppError('Failed to close the store.', 'dpuse-app.InvestigateDataPanel', { typeId: 'handled' }, { cause: error }));
    });
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// A press of the pill asks for the data. Arriving from the task bar only looks, so a long load never starts by itself.
// The request is taken once, so reloading the page does not repeat it.
function wasLoadRequested(): boolean {
    const historyState = history.state as { loadIsRequested?: boolean } | null;
    if (historyState?.loadIsRequested !== true) return false;
    history.replaceState({ ...historyState, loadIsRequested: false }, '');
    return true;
}

function handleRetry(): void {
    void openAndLoad(false);
}

function handleLoadAgain(): void {
    void openAndLoad(true);
}

function handleStopLoad(): void {
    if (dataViewConfig.value == null) return;
    loadIsStopped.value = true;
    void abortDataViewRecordLoad(dataViewConfig.value).catch((error: unknown) => {
        raiseFailure(new AppError('Failed to stop loading the records.', 'dpuse-app.InvestigateDataPanel.handleStopLoad', { typeId: 'handled' }, { cause: error }));
    });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A data view is loaded the first time it is investigated, and again when its columns have changed or the user asks.
// Later visits read the records already stored.
async function openAndLoad(isReloaded: boolean): Promise<void> {
    const openedDataViewConfig = dataViewConfig.value;
    if (openedDataViewConfig == null || investigateState.value.typeId === 'loading') return;
    investigateState.value = { typeId: 'opening' };
    try {
        const storeStateId = await openDataViewStore(draftIsCurrent.value ? openedDataViewConfig.id : undefined);
        if (storeStateId !== 'ready') {
            investigateState.value = { typeId: storeStateId };
            return;
        }
        if (isReloaded || !isDataViewLoaded(openedDataViewConfig, draftIsCurrent.value)) {
            investigateState.value = { typeId: 'loading' };
            loadDuration.value = undefined;
            loadedRecordCount.value = 0;
            loadIsStopped.value = false;
            const loadStartTime = performance.now();
            const { columnsHaveChanged, invalidValueCounts: newInvalidValueCounts } = await loadDataViewRecords(openedDataViewConfig, draftIsCurrent.value, (recordCount) => {
                loadedRecordCount.value = recordCount;
            });
            if (columnsHaveChanged) {
                investigateState.value = { typeId: 'columnsChanged' };
                return;
            }
            invalidValueCounts.value = newInvalidValueCounts;
            loadDuration.value = performance.now() - loadStartTime;
            loadVersion.value++;
        }
        investigateState.value = { typeId: 'ready' };
    } catch (error) {
        if (loadIsAbandoned.value) return;
        if (loadIsStopped.value) {
            investigateState.value = { typeId: 'stopped' };
            return;
        }
        const failure = raiseFailure(
            new AppError("Failed to load the data view's records.", 'dpuse-app.InvestigateDataPanel.openAndLoad', { typeId: 'handled' }, { cause: error })
        );
        investigateState.value = { typeId: 'failed', failure };
    }
}

// Numbers sit to the right, with digits of one width, so they can be compared by size.
function constructValueCellClass(columnId: string): string | undefined {
    const columnIndex = Number(columnId.slice(1));
    return constructDataTypeCellClass(columnConfigs.value[columnIndex]?.dataTypeId);
}

// The records load in pages, so the widest value of all is not known. The first page is the best guide to the rest.
function fitColumnsToFirstPage(dataSourceId: string, rows: DisplayRow[]): void {
    if (firstPageColumnWidths.value?.dataSourceId === dataSourceId) return;
    const widths = columnDefinitions.value.map(({ header }, index) => {
        const percentSign = percentageColumnIndexes.value.has(index) ? ' %' : ''; // Measured with its unit, so a currency or sign never covers the number.
        const values = rows.map((row) => `${row[constructUnitKey(index)] ?? ''} ${row[constructColumnKey(index)] ?? ''}${percentSign}`.trim());
        return constructFittedColumnWidth(String(header), values, { headerExtraPx: HEADER_MENU_WIDTH_PX });
    });
    firstPageColumnWidths.value = { dataSourceId, widths };
}

function constructColumnKey(columnIndex: number): string {
    return `c${String(columnIndex)}`;
}

function constructUnitKey(columnIndex: number): string {
    return `u${String(columnIndex)}`;
}

// A percentage is stored as a fraction, such as 0.5, and shown as the number it was written as, 50, beside its sign.
function constructDisplayRow(storeRecord: StoreRecord): DisplayRow {
    const displayRow: DisplayRow = {};
    for (const [columnIndex, columnConfig] of columnConfigs.value.entries()) {
        const unitIndex = unitColumnIndexes.value.get(columnIndex);
        const unit = unitIndex === undefined ? undefined : storeRecord[unitIndex];
        const value = storeRecord[columnIndex] ?? null;
        const shownValue = unit === '%' && typeof value === 'number' ? convertFractionToPercentage(value) : value;
        displayRow[constructColumnKey(columnIndex)] = formatStoreValue(shownValue, columnConfig, numberFormats.value[columnIndex]);
        if (typeof unit === 'string') displayRow[constructUnitKey(columnIndex)] = unit;
    }
    return displayRow;
}

// Moves the decimal point two places in the text rather than multiplying by 100, which would show 0.011 as
// 1.0999999999999999.
function convertFractionToPercentage(fraction: number): number {
    const text = String(fraction);
    const exponentIndex = text.indexOf('e');
    if (exponentIndex !== -1) {
        const exponent = Number(text.slice(exponentIndex + 1)) + 2;
        return Number(`${text.slice(0, exponentIndex)}e${String(exponent)}`);
    }
    const [sign, digits] = text.startsWith('-') ? ['-', text.slice(1)] : ['', text];
    const pointIndex = digits.indexOf('.');
    const whole = pointIndex === -1 ? digits : digits.slice(0, pointIndex);
    const shiftedDecimals = (pointIndex === -1 ? '' : digits.slice(pointIndex + 1)).padEnd(2, '0');
    return Number(`${sign}${whole}${shiftedDecimals.slice(0, 2)}.${shiftedDecimals.slice(2) || '0'}`);
}

// The unit shown before a number, at the cell's left edge. A percent sign goes after it instead.
function findCurrencyUnit(columnId: string, row: DisplayRow | undefined): string | undefined {
    const unit = row?.[constructUnitKey(Number(columnId.slice(1)))];
    return unit === undefined || unit === '%' ? undefined : unit;
}

function isPercentageColumn(columnId: string): boolean {
    return percentageColumnIndexes.value.has(Number(columnId.slice(1)));
}

// Each value is stored as its column's type, so a date or number is formatted for the locale and anything else shows as
// itself.
function formatStoreValue(value: StoreValue, columnConfig: ObjectColumnConfig, numberFormat: Intl.NumberFormat | undefined): string {
    if (value == null) return '';
    if (numberFormat != null && columnConfig.dataTypeId === 'numeric' && (typeof value === 'number' || typeof value === 'bigint')) return numberFormat.format(value);
    if (value instanceof Date) {
        const formatOptions = columnConfig.dataSubtypeId == null ? undefined : DATE_FORMAT_OPTIONS[columnConfig.dataSubtypeId];
        return new Intl.DateTimeFormat(localeId.value, formatOptions ?? DATE_TIME_FORMAT_OPTIONS).format(value);
    }
    return String(value);
}
</script>

<template>
    <div class="relative flex min-h-0 flex-1 flex-col" data-region="InvestigateDataPanel">
        <BusyBar v-if="investigateState.typeId === 'opening' || investigateState.typeId === 'loading'" />

        <ErrorNotice v-if="investigateState.typeId === 'failed'" :failures="[investigateState.failure]" @retry="handleRetry" />

        <template v-else>
            <!-- Toolbar ─ 'Load again' is for a data view whose source may have changed since it was loaded. -->
            <div
                v-if="investigateState.typeId === 'ready' || investigateState.typeId === 'loading'"
                class="flex h-9.25 flex-none items-center justify-end gap-x-3 border-b border-separator px-page text-xs"
            >
                <span v-if="investigateState.typeId === 'ready' && columnsAreFromPartialAudit" class="mr-auto text-muted">{{ t(TEXT, 'load.partialAuditTypes.text') }}</span>
                <span v-if="investigateState.typeId === 'ready' && loadDurationText" class="text-muted">{{ loadDurationText }}</span>
                <ActionWrapper v-if="investigateState.typeId === 'loading'" class="text-accent hover:underline" @click="handleStopLoad">{{
                    t(TEXT, 'load.stop.label')
                }}</ActionWrapper>
                <ActionWrapper v-else class="inline-flex items-center gap-x-1 text-accent hover:underline" @click="handleLoadAgain">
                    <RefreshCwIcon aria-hidden="true" class="size-4" :stroke-width="1.5" />
                    {{ t(TEXT, 'load.again.label') }}
                </ActionWrapper>
            </div>

            <!-- Mismatches ─ Between the toolbar and the records, so they show before anyone reads a blank as missing data. A
                 long list scrolls rather than pushing the records out of view. -->
            <div
                v-if="investigateState.typeId === 'ready' && invalidValueItems.length > 0"
                class="max-h-32 flex-none overflow-y-auto border-b border-separator px-page py-2 text-sm"
                role="status"
            >
                <ul class="flex flex-col gap-y-1">
                    <li v-for="item in invalidValueItems" :key="item.id">
                        {{ t(TEXT, 'invalid.text', { count: new Intl.NumberFormat(localeId).format(item.count), label: item.label }) }}
                        <RouterLink class="ml-1" :to="{ name: 'item', query: route.query, state: { columnIndex: Number(item.id) } }">{{
                            t(TEXT, 'invalid.check.label')
                        }}</RouterLink>
                    </li>
                </ul>
            </div>

            <!-- The usual room after the last row, less the status bar's height: the table already ends above it. -->
            <Table
                v-if="investigateState.typeId === 'ready' && columnConfigs.length > 0"
                class="flex-1"
                :column-definitions="columnDefinitions"
                :construct-cell-class="constructValueCellClass"
                :data-source="dataSource"
                :hidden-column-ids="hiddenColumnIds"
                is-column-fit-to-visible-rows
                scroll-area-padding-bottom="calc(var(--vertical-scroll-bottom-screen-inset) - var(--status-bar-height))"
            >
                <!-- Units ─ A currency at the left edge, and a percent sign after the number. The sign's room is kept
                     on every row of a column with any percentage, unseen where there is none, so the decimal points
                     line up. -->
                <template #cell-icon="{ columnId, row }">
                    <span v-if="findCurrencyUnit(columnId, row)" class="mr-auto text-sm text-muted">{{ findCurrencyUnit(columnId, row) }}</span>
                    <span v-if="isPercentageColumn(columnId) && row != null" class="order-1 -ml-1 text-sm text-muted" :class="{ invisible: row[`u${columnId.slice(1)}`] !== '%' }">%</span>
                </template>
            </Table>
            <!-- Announced as it changes, because the count is the only sign that a long load is still going. -->
            <p v-else-if="investigateState.typeId === 'loading'" aria-live="polite" class="m-auto px-4 text-center text-sm text-muted">{{ loadPendingText }}</p>
            <div v-else-if="messageKey" class="m-auto flex flex-col items-center gap-y-2 px-4 text-center text-sm text-muted">
                <p>{{ t(TEXT, messageKey) }}</p>
                <ActionWrapper v-if="investigateState.typeId !== 'columnsRequired'" class="text-accent hover:underline" @click="handleRetry">{{
                    t(TEXT, messageActionKey)
                }}</ActionWrapper>
            </div>
        </template>

        <!-- Status Bar ─ Blank for now. Keeps the table, and its horizontal scroll bar, above the bottom safe area on
             iOS, as the item preview's status bar does. -->
        <div class="mt-auto h-(--status-bar-height) w-full flex-none border-t border-separator bg-card" />
    </div>
</template>
