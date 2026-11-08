<script setup lang="ts">
// ── External Dependencies & Registrations
import type { ColumnDef } from '@tanstack/vue-table';
import { useRoute } from 'vue-router';
import { ChevronDownIcon, ClockIcon, DatabaseIcon, RefreshCwIcon, SlidersHorizontalIcon, TriangleAlertIcon } from '@lucide/vue';
import { computed, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { DataSubtypeId, ObjectColumnConfig, StoreRecord, StoreValue } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { changeDataView } from '@/features/studio/dataViews/_dataViewDraft';
import { constructColumnTypeLabel } from '@/features/studio/dataViews/_previewColumnRows';
import type { DataSource } from '@/composables/useDataWindow';
import { TEXT } from './InvestigateDataPanel_.json';
import { useCurrentDataView } from '@/features/studio/dataViews/_dataViews';
import {
    abortDataViewRecordLoad,
    closeDataViewStore,
    findDataViewStoreLabel,
    hasDataViewLoad,
    isDataViewLoaded,
    listDataViewStoreConnections,
    loadDataViewRecords,
    openDataViewStore,
    queryDataViewRecords,
    resolveDataViewTablePath,
    resolveStoreConnectorId
} from '@/features/studio/dataViews/_dataViewStore';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';
import {
    type ColumnType,
    constructColumnsVersion,
    constructColumnTypeId,
    constructDataTypeCellClass,
    constructLoadColumnConfigs,
    isDerivedColumn,
    isEmptyUnitColumn,
    type ItemReading
} from '@/features/studio/dataViews/_dataViewColumns';
import { constructFittedColumnWidth, HEADER_MENU_WIDTH_PX, HEADER_TAB_INSET_PX } from '@/components/ui/table/tableColumnWidth';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import BusyBar from '@/components/ui/BusyBar.vue';
import CloseButton from '@/components/ui/action/CloseButton.vue';
import ColumnDetailPanel from '@/features/studio/dataViews/ColumnDetailPanel.vue';
import ColumnSearch from '@/features/studio/dataViews/ColumnSearch.vue';
import type { ColumnSearchOption } from '@/features/studio/dataViews/ColumnSearch.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import { Menu } from '@/components/ui/menu';
import type { SelectOption } from '@/components/ui/SelectInput.vue';
import Table from '@/components/ui/table/Table.vue';
import type { TableFeatureSet } from '@/components/ui/table/tableFeatures';
import TransformDataPanel from './TransformDataPanel.vue';

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
    constructLoadColumnConfigs({ columnChoiceConfigs: dataViewConfig.value?.columnChoiceConfigs, contentAuditConfig: dataViewConfig.value?.contentAuditConfig })
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

// ── Overlays ─ Transform and a column's detail cover the records one at a time.
const selectedColumnIndex = ref<number>(); // The column whose detail is showing over the records.
const tableComponent = useTemplateRef<{ scrollColumnIntoView: (columnId: string) => void }>('table'); // Typed by what it exposes, because 'Table' is generic.
const transformIsOpen = ref(false);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const storeConnectorId = computed(() => resolveStoreConnectorId(dataViewConfig.value)); // Chosen on the item step, or by 'Load again'.
const storeConnections = computed(() => listDataViewStoreConnections());
const storeIsChoosable = computed(() => storeConnections.value.length > 1);
const selectedStoreConnection = computed(() => storeConnections.value.find((connection) => connection.id === storeConnectorId.value)); // For its icon in the status bar.

const messageKey = computed(() => {
    return investigateState.value.typeId === 'notLoaded' && hasEarlierLoad.value ? 'load.changed.text' : MESSAGE_KEYS[investigateState.value.typeId];
});
const hasEarlierLoad = computed(() => dataViewConfig.value != null && hasDataViewLoad(dataViewConfig.value, draftIsCurrent.value));
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

// One decimal place, with more only for a time too short to show in one, so a quick load does not read as 0.
const loadSecondsText = computed(() => {
    if (loadDuration.value == null) return '';
    return new Intl.NumberFormat(localeId.value, {
        maximumFractionDigits: 1,
        maximumSignificantDigits: 1,
        minimumFractionDigits: 1,
        minimumSignificantDigits: 1,
        roundingPriority: 'morePrecision'
    }).format(loadDuration.value / 1000);
});
const loadDurationText = computed(() =>
    loadSecondsText.value === '' ? '' : t(TEXT, 'load.duration.text', { seconds: loadSecondsText.value, store: findDataViewStoreLabel(storeConnectorId.value) })
); // The status bar's store and time as one sentence, for screen readers.

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
    const tablePath = dataViewConfig.value == null ? undefined : resolveDataViewTablePath(dataViewConfig.value, draftIsCurrent.value);
    const queriedStoreConnectorId = storeConnectorId.value;
    const dataSourceId = `${tablePath ?? ''}|${String(loadVersion.value)}`;
    return {
        id: dataSourceId,
        rowCount: undefined,
        getRows: async (startRow: number, endRow: number): Promise<{ rows: DisplayRow[]; totalCount: number }> => {
            if (tablePath == null) return { rows: [], totalCount: 0 };
            try {
                const query = { aggregates: [], filters: [], groupColumnIndexes: [], limit: endRow - startRow, offset: startRow, sorts: [] };
                const { records, totalCount } = await queryDataViewRecords(queriedStoreConnectorId, tablePath, query);
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
    () => new Set([...unitColumnIndexes.value].filter(([, unitIndex]) => (columnConfigs.value[unitIndex]?.formats['%'] ?? 0) > 0).map(([sourceIndex]) => sourceIndex))
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

// ── Column Detail ─ Read only, from the reading and audit the data view saved, because changing how a column is read
// would make the loaded records out of date. The choices show as they are, each as its one option, and link to the item
// step, where they can be changed.
const itemReading = computed((): ItemReading | undefined => {
    const { readingConfig, sampleConfig } = dataViewConfig.value ?? {};
    return readingConfig == null || sampleConfig == null ? undefined : { ...readingConfig, ...sampleConfig, columnConfigs: columnConfigs.value };
});
const detailColumnIndexes = computed(() =>
    columnConfigs.value.map((columnConfig, index) => (isDerivedColumn(columnConfig) ? undefined : index)).filter((index) => index !== undefined)
); // A derived column only holds values for another.
// The columns the toolbar's search can find. One marked by a load's values that did not fit is the one to check.
const columnSearchOptions = computed((): ColumnSearchOption[] =>
    detailColumnIndexes.value.map((columnIndex) => ({
        id: String(columnIndex),
        label: String(columnDefinitions.value[columnIndex]?.header),
        needsAttention: (invalidValueCounts.value[columnIndex] ?? 0) > 0
    }))
);
const selectedColumnStepIndex = computed(() => {
    const stepIndex = selectedColumnIndex.value == null ? -1 : detailColumnIndexes.value.indexOf(selectedColumnIndex.value);
    return stepIndex === -1 ? undefined : stepIndex;
});
const selectedColumnConfig = computed(() => (selectedColumnIndex.value == null ? undefined : columnConfigs.value[selectedColumnIndex.value]));
const selectedDetectedColumnType = computed((): ColumnType | undefined => {
    const auditedColumnConfig = selectedColumnIndex.value == null ? undefined : dataViewConfig.value?.contentAuditConfig?.columns[selectedColumnIndex.value];
    return auditedColumnConfig == null ? undefined : { dataSubtypeId: auditedColumnConfig.dataSubtypeId, dataTypeId: auditedColumnConfig.dataTypeId };
});
const selectedColumnTypeOptions = computed((): SelectOption[] =>
    selectedColumnConfig.value == null ? [] : [{ id: constructColumnTypeId(selectedColumnConfig.value), label: constructColumnTypeLabel(selectedColumnConfig.value) }]
);
const selectedDecimalSeparatorOptions = computed((): SelectOption[] => {
    const decimalSeparatorId = selectedColumnConfig.value?.dataTypeId === 'numeric' ? selectedColumnConfig.value.decimalSeparatorId : undefined;
    return decimalSeparatorId == null
        ? []
        : [{ id: decimalSeparatorId, label: t(TEXT, decimalSeparatorId === ',' ? 'decimalSeparator.comma.label' : 'decimalSeparator.point.label') }];
});
const selectedNullWordReading = computed(() => {
    if (selectedColumnConfig.value?.dataTypeId !== 'string') return;
    return selectedColumnConfig.value.nullWordsAreEmpty === true ? 'empty' : 'text';
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Opens the store once the data view has columns, and again when they change, which needs a new load.
watch(
    () => constructColumnsVersion(dataViewConfig.value),
    (columnsVersion) => {
        selectedColumnIndex.value = undefined; // New columns can leave the one showing out of range.
        if (columnsVersion == null) investigateState.value = { typeId: 'columnsRequired' };
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
    void closeDataViewStore(storeConnectorId.value).catch((error: unknown) => {
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

function handleToggleTransform(): void {
    transformIsOpen.value = !transformIsOpen.value;
    selectedColumnIndex.value = undefined;
}

// Opens a column's detail over the records, or closes it when it is the column already showing.
function handleToggleColumnDetail(columnIndex: number): void {
    selectedColumnIndex.value = columnIndex === selectedColumnIndex.value ? undefined : columnIndex;
    transformIsOpen.value = false;
}

// A column found with the toolbar's search opens its detail, and the table scrolls to it, as it does for Previous and Next.
function handleSelectColumn(columnIndex: number): void {
    selectedColumnIndex.value = columnIndex;
    transformIsOpen.value = false;
    tableComponent.value?.scrollColumnIntoView(constructColumnKey(columnIndex));
}

function handleStepColumn(direction: -1 | 1): void {
    const stepIndex = selectedColumnStepIndex.value;
    if (stepIndex == null) return;
    const nextStepIndex = stepIndex + direction;
    const nextColumnIndex = nextStepIndex < 0 ? undefined : detailColumnIndexes.value.at(nextStepIndex); // 'at' would read a negative index from the end.
    if (nextColumnIndex == null) return;
    selectedColumnIndex.value = nextColumnIndex;
    tableComponent.value?.scrollColumnIntoView(constructColumnKey(nextColumnIndex)); // Brings the tab into view, as on the item step.
}

// A different store becomes the data view's unsaved choice, as on the item step, and takes the records from this load.
// The old store is closed, so another tab can use it. Choosing the current store just loads again.
function handleLoadAgainIntoStore(chosenStoreConnectorId: string): void {
    const previousStoreConnectorId = storeConnectorId.value;
    const storeIsChanged = dataViewConfig.value != null && chosenStoreConnectorId !== previousStoreConnectorId;
    if (storeIsChanged) changeDataView({ ...assertDefined(dataViewConfig.value), storeConnectorId: chosenStoreConnectorId });
    void openAndLoad(true); // Before the close, so the records leave the screen before their store goes.
    if (!storeIsChanged) return;
    void closeDataViewStore(previousStoreConnectorId).catch((error: unknown) => {
        raiseFailure(new AppError('Failed to close the store.', 'dpuse-app.InvestigateDataPanel.handleLoadAgainIntoStore', { typeId: 'handled' }, { cause: error }));
    });
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
        const storeStateId = await openDataViewStore(resolveStoreConnectorId(openedDataViewConfig), draftIsCurrent.value ? openedDataViewConfig.id : undefined);
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
        return constructFittedColumnWidth(String(header), values, { headerExtraPx: HEADER_MENU_WIDTH_PX + HEADER_TAB_INSET_PX }); // The headers are tabs, which take room from the label.
    });
    firstPageColumnWidths.value = { dataSourceId, widths };
}

function constructColumnKey(columnIndex: number): string {
    return `c${String(columnIndex)}`;
}

function readColumnIndex(columnKey: string): number {
    return Number(columnKey.slice(1));
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
            <!-- Mismatches ─ Above the records, so they show before anyone reads a blank as missing data. A long list
                 scrolls rather than pushing the records out of view. -->
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

            <div v-if="investigateState.typeId === 'ready' && columnConfigs.length > 0" class="relative flex min-h-0 flex-1 flex-col">
                <!-- The usual room after the last row, less the status bar's height: the table already ends above it. -->
                <Table
                    ref="table"
                    class="flex-1"
                    :column-definitions="columnDefinitions"
                    :construct-cell-class="constructValueCellClass"
                    :data-source="dataSource"
                    :hidden-column-ids="hiddenColumnIds"
                    is-column-fit-to-visible-rows
                    is-header-tabbed
                    scroll-area-padding-bottom="calc(var(--vertical-scroll-bottom-screen-inset) - var(--status-bar-height))"
                    :selected-column-id="selectedColumnIndex == null ? undefined : constructColumnKey(selectedColumnIndex)"
                >
                    <!-- Actions ─ In the table's toolbar, beside its column picker. 'Load again' is for a data view whose
                         source may have changed since it was loaded. -->
                    <template #toolbar-end>
                        <!-- Column Search ─ Opens over the whole toolbar, as on the item step. -->
                        <ColumnSearch v-if="columnSearchOptions.length > 1" :options="columnSearchOptions" @select="handleSelectColumn" />
                        <ActionWrapper
                            aria-controls="dpuse-transform-panel"
                            :aria-expanded="transformIsOpen"
                            class="inline-flex items-center gap-x-1 text-accent hover:underline"
                            @click="handleToggleTransform"
                        >
                            <SlidersHorizontalIcon aria-hidden="true" class="size-4" :stroke-width="1.5" />
                            {{ t(TEXT, 'transform.label') }}
                        </ActionWrapper>
                        <!-- Load Again ─ A menu of the stores when there is more than one, so the records can move to
                             another store without going back to the item step. The current store is ticked. -->
                        <Menu.Root v-if="storeIsChoosable" class="flex">
                            <template #trigger="{ triggerAttributes }">
                                <ActionWrapper v-bind="triggerAttributes" class="inline-flex items-center gap-x-1 text-accent hover:underline">
                                    <RefreshCwIcon aria-hidden="true" class="size-4" :stroke-width="1.5" />
                                    {{ t(TEXT, 'load.again.label') }}
                                    <ChevronDownIcon aria-hidden="true" class="size-3.5" :stroke-width="1.5" />
                                </ActionWrapper>
                            </template>
                            <Menu.Content :label="t(TEXT, 'load.again.store.aria')" placement="bottom-end">
                                <Menu.Item
                                    v-for="storeConnection in storeConnections"
                                    :key="storeConnection.id"
                                    :is-checked="storeConnection.id === storeConnectorId"
                                    kind="radio"
                                    @select="handleLoadAgainIntoStore(storeConnection.id)"
                                >
                                    <template #icon>
                                        <span class="flex size-[1.25em] flex-none">
                                            <ConfigIcon class="size-full" :icon="storeConnection.icon" :icon-dark="storeConnection.iconDark" />
                                        </span>
                                    </template>
                                    {{ storeConnection.label }}
                                </Menu.Item>
                            </Menu.Content>
                        </Menu.Root>
                        <ActionWrapper v-else class="inline-flex items-center gap-x-1 text-accent hover:underline" @click="handleLoadAgain">
                            <RefreshCwIcon aria-hidden="true" class="size-4" :stroke-width="1.5" />
                            {{ t(TEXT, 'load.again.label') }}
                        </ActionWrapper>
                    </template>
                    <!-- Column Name ─ Opens the column's detail over the records, or closes it on the selected tab, as on the
                         item step. The button's overlay covers the whole tab, so a click anywhere on it does the same, while
                         the name stays the button's accessible name. A derived column has no detail of its own, so it keeps
                         its plain name. -->
                    <template #header-label="{ columnId }">
                        <ActionWrapper
                            v-if="detailColumnIndexes.includes(readColumnIndex(columnId))"
                            :aria-current="readColumnIndex(columnId) === selectedColumnIndex ? 'true' : undefined"
                            class="min-w-0 flex-1 truncate text-left text-sm font-medium after:absolute after:inset-0"
                            :class="readColumnIndex(columnId) === selectedColumnIndex ? 'text-emphasis' : 'text-muted'"
                            :title="
                                t(TEXT, readColumnIndex(columnId) === selectedColumnIndex ? 'columnDetail.close.label' : 'columnDetail.label', {
                                    label: String(columnDefinitions[readColumnIndex(columnId)]?.header)
                                })
                            "
                            @click="handleToggleColumnDetail(readColumnIndex(columnId))"
                            >{{ columnDefinitions[readColumnIndex(columnId)]?.header }}</ActionWrapper
                        >
                        <span v-else class="min-w-0 flex-1 truncate text-sm font-medium text-muted">{{ columnDefinitions[readColumnIndex(columnId)]?.header }}</span>
                    </template>
                    <!-- Units ─ A currency at the left edge, and a percent sign after the number. The sign's room is kept
                         on every row of a column with any percentage, unseen where there is none, so the decimal points
                         line up. -->
                    <template #cell-icon="{ columnId, row }">
                        <span v-if="findCurrencyUnit(columnId, row)" class="mr-auto text-sm text-muted">{{ findCurrencyUnit(columnId, row) }}</span>
                        <span
                            v-if="isPercentageColumn(columnId) && row != null"
                            class="order-1 -ml-1 text-sm text-muted"
                            :class="{ invisible: row[`u${columnId.slice(1)}`] !== '%' }"
                            >%</span
                        >
                    </template>
                </Table>
                <!-- Transform ─ Slides down from under the table's toolbar and covers the column names and records, because
                     it replaces the table while it is open. The toolbar's actions stay in reach. The box clips the panel,
                     so it never passes over the toolbar, and lets clicks through to the table while it is closed. -->
                <div class="pointer-events-none absolute inset-x-0 top-10 bottom-0 z-10 overflow-hidden">
                    <Transition name="dpuse-slide-down">
                        <section
                            v-if="transformIsOpen"
                            id="dpuse-transform-panel"
                            :aria-label="t(TEXT, 'transform.title')"
                            class="pointer-events-auto absolute inset-0 flex flex-col bg-surface shadow-md"
                        >
                            <header class="flex h-10 flex-none items-center gap-x-3 border-b border-separator px-page text-xs">
                                <h2 class="m-0 mr-auto text-sm font-medium text-emphasis">{{ t(TEXT, 'transform.title') }}</h2>
                                <!-- TODO: Apply stays dimmed until the query is wired up, because there is no change to apply yet. -->
                                <ActionWrapper class="text-accent enabled:hover:underline" disabled>{{ t(TEXT, 'transform.apply.label') }}</ActionWrapper>
                                <!-- '-mr-1.75' cancels the button's padding, so its icon lines up with the page edge. -->
                                <CloseButton :accessible-label="t(TEXT, 'transform.close.aria')" class="-mr-1.75" @click="transformIsOpen = false" />
                            </header>
                            <TransformDataPanel class="min-h-0 flex-1" />
                        </section>
                    </Transition>
                </div>
                <!-- Column Detail ─ Slides down from under the column names, 80px down past the toolbar and the names, so
                     the tabs stay in reach and another one can be chosen, as on the item step. -->
                <div class="pointer-events-none absolute inset-x-0 top-20 bottom-0 z-10 overflow-hidden">
                    <Transition name="dpuse-slide-down">
                        <ColumnDetailPanel
                            v-if="selectedColumnIndex != null && itemReading != null"
                            class="pointer-events-auto absolute inset-0 bg-surface shadow-md"
                            :column-index="selectedColumnIndex"
                            :decimal-separator-options="selectedDecimalSeparatorOptions"
                            :decimal-separator-value="selectedDecimalSeparatorOptions[0]?.id"
                            :detected-column-type="selectedDetectedColumnType"
                            :has-next-column="selectedColumnStepIndex != null && selectedColumnStepIndex < detailColumnIndexes.length - 1"
                            :has-previous-column="selectedColumnStepIndex != null && selectedColumnStepIndex > 0"
                            is-type-disabled
                            :item-reading="itemReading"
                            :null-word-reading="selectedNullWordReading"
                            :type-options="selectedColumnTypeOptions"
                            :type-value="selectedColumnTypeOptions[0]?.id ?? ''"
                            @close="selectedColumnIndex = undefined"
                            @step="handleStepColumn"
                        >
                            <template #choices-end>
                                <RouterLink class="mt-2 inline-block" :to="{ name: 'item', query: route.query, state: { columnIndex: selectedColumnIndex } }">{{
                                    t(TEXT, 'columnDetail.change.label')
                                }}</RouterLink>
                            </template>
                        </ColumnDetailPanel>
                    </Transition>
                </div>
            </div>
            <!-- Stop ─ In the middle while loading, because the table and its toolbar show only once the records are in. -->
            <ActionWrapper v-else-if="investigateState.typeId === 'loading'" class="m-auto text-sm text-accent hover:underline" @click="handleStopLoad">{{
                t(TEXT, 'load.stop.label')
            }}</ActionWrapper>
            <div v-else-if="messageKey" class="m-auto flex flex-col items-center gap-y-2 px-4 text-center text-sm text-muted">
                <p>{{ t(TEXT, messageKey) }}</p>
                <ActionWrapper v-if="investigateState.typeId !== 'columnsRequired'" class="text-accent hover:underline" @click="handleRetry">{{
                    t(TEXT, messageActionKey)
                }}</ActionWrapper>
            </div>
        </template>

        <!-- Status Bar ─ The same height as the item step's, so the table's sideways scroll bar always sits above the
             bottom safe area. It only shows what is read, never a button, because a phone's own swipes start at its
             bottom edge. The state is on the left and the figures on the right. Only a warning takes colour, so it
             stands out when it shows. -->
        <div
            class="mt-auto flex h-(--status-bar-height) w-full flex-none items-center justify-between gap-x-4 overflow-hidden border-t border-separator bg-card px-page text-xs text-muted"
        >
            <!-- State ─ Announced as it changes, because the count is the only sign that a long load is still going.
                 Each text is trimmed to its letters so it is centred on them rather than sitting high in its line box,
                 and cut off sideways only ('overflow-x: clip'), because hiding overflow on both axes would clip the
                 tails of letters like 'g' below the trimmed box. -->
            <p aria-live="polite" class="flex min-w-0 items-center gap-x-1">
                <span v-if="investigateState.typeId === 'loading'" class="min-w-0 overflow-x-clip text-ellipsis whitespace-nowrap [text-box:trim-both_cap_alphabetic]">{{
                    loadPendingText
                }}</span>
                <template v-else-if="investigateState.typeId === 'ready' && columnsAreFromPartialAudit">
                    <TriangleAlertIcon aria-hidden="true" class="size-3.5 flex-none text-warning-text" :stroke-width="1.5" />
                    <span class="min-w-0 overflow-x-clip text-ellipsis whitespace-nowrap text-warning-text [text-box:trim-both_cap_alphabetic]">{{
                        t(TEXT, 'load.partialAuditTypes.text')
                    }}</span>
                </template>
            </p>
            <!-- Figures ─ Where the records went and how long they took. -->
            <p v-if="investigateState.typeId === 'ready' && loadSecondsText" class="flex flex-none items-center gap-x-1">
                <span class="sr-only">{{ loadDurationText }}</span>
                <ConfigIcon
                    v-if="selectedStoreConnection?.icon ?? selectedStoreConnection?.iconDark"
                    aria-hidden="true"
                    class="size-3.5 flex-none"
                    :icon="selectedStoreConnection?.icon"
                    :icon-dark="selectedStoreConnection?.iconDark"
                />
                <DatabaseIcon v-else aria-hidden="true" class="size-3.5 flex-none" :stroke-width="1.5" />
                <span aria-hidden="true" class="whitespace-nowrap [text-box:trim-both_cap_alphabetic]">{{ findDataViewStoreLabel(storeConnectorId) }}</span>
                <span aria-hidden="true" class="ml-1.5 flex items-center gap-x-1">
                    <ClockIcon class="size-3.5 flex-none" :stroke-width="1.5" />
                    <span class="whitespace-nowrap tabular-nums [text-box:trim-both_cap_alphabetic]">{{ t(TEXT, 'load.seconds.text', { seconds: loadSecondsText }) }}</span>
                </span>
            </p>
        </div>
    </div>
</template>
