<script setup lang="ts">
// ── External Dependencies & Registrations
import type { ColumnDef } from '@tanstack/vue-table';
import { ChevronDownIcon, SlidersHorizontalIcon, TriangleAlertIcon } from '@lucide/vue';
import { type Component, computed, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useConfirmDialog, useIntervalFn } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, findStoreErrorId } from '@dpuse/dpuse-shared';
import type { ColumnAuditConfig, DataSubtypeId, StoreRecord, StoreValue } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { changeDataView } from '@/features/studio/dataViews/_state/dataViewDraft';
import { constructColumnTypeLabel } from '@/features/studio/dataViews/_columns/previewColumnRows';
import { constructColumnValueCounts } from '@/features/studio/dataViews/_columns/previewColumnRows';
import type { DataSource } from '@/composables/useDataWindow';
import { findConnectionLocalisedConfig } from '@/state/configs';
import { getColumnTypeIcon } from '@/features/studio/dataViews/_columns/columnTypeIcons';
import { ignoreReportedNavigationFailure } from '@/router';
import { PREVIEW_COLUMN_MARKS_WIDTH_PX } from '@/features/studio/dataViews/_columns/previewColumnRows';
import { TEXT } from './InvestigateDataPanel_.json';
import { useCurrentDataView } from '@/features/studio/dataViews/_state/dataViews';
import { useItemChange } from '@/features/studio/dataViews/_components/itemChange';
import { viewportIsWide } from '@/state/device';
import {
    abortDataViewRecordLoad,
    constructLoadTimingParts,
    constructStoredColumnConfigs,
    type DataViewColumnValueCounts,
    findDataViewInvalidValueCounts,
    findDataViewLoadTiming,
    forgetDataViewLoad,
    hasDataViewLoad,
    INVESTIGATE_STORE_CONNECTOR_ID,
    isDataViewLoaded,
    listDataViewStoreConfigs,
    loadDataViewRecords,
    openDataViewStore,
    queryDataViewColumnValueCounts,
    queryDataViewRecords,
    resolveDataViewTablePath,
    resolveStoreConnectorId
} from '@/features/studio/dataViews/_state/dataViewStore';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';
import { type ColumnFacts, constructColumnFacts } from '@/features/studio/dataViews/_columns/previewColumnRows';
import {
    type ColumnType,
    constructChosenColumnTypes,
    constructColumnsVersion,
    constructColumnTypeId,
    constructDataTypeCellClass,
    constructIgnoredColumnIndexes,
    constructLoadColumnConfigs,
    isDerivedColumn,
    isEmptyUnitColumn,
    type ItemReading,
    placeLoadedValues
} from '@/features/studio/dataViews/_state/dataViewColumns';
import { constructFittedColumnWidth, HEADER_MENU_WIDTH_PX, HEADER_TAB_INSET_PX } from '@/components/ui/table/tableColumnWidth';
import { formatElapsedDuration, formatFinishedDuration, formatStatusPercentage } from '@/features/studio/dataViews/_components/_statusBar';
import { holdStore, isStoreConnection, openStore, storeTakeover } from '@/services/storeUse';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import BusyBar from '@/components/ui/BusyBar.vue';
import CloseButton from '@/components/ui/action/CloseButton.vue';
import ColumnDetail from '@/features/studio/dataViews/_columns/ColumnDetail.vue';
import ColumnSearch from '@/features/studio/dataViews/_columns/ColumnSearch.vue';
import type { ColumnSearchOption } from '@/features/studio/dataViews/_columns/ColumnSearch.vue';
import ColumnTabMarks from '@/features/studio/dataViews/_columns/ColumnTabMarks.vue';
import ColumnValueBar from '@/features/studio/dataViews/_columns/ColumnValueBar.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import ItemChangedNotice from '@/features/studio/dataViews/_components/ItemChangedNotice.vue';
import { Menu } from '@/components/ui/menu';
import type { SelectOption } from '@/components/ui/SelectInput.vue';
import StatusBar from '@/features/studio/dataViews/_components/StatusBar.vue';
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
const router = useRouter();

// ── Data View
const { data: dataViewConfig, draftIsCurrent } = useCurrentDataView(() => route.params.dataViewId);
const columnsAreFromPartialAudit = computed(() => dataViewConfig.value?.contentAuditConfig?.isComplete === false);
const columnConfigs = computed(() =>
    constructLoadColumnConfigs({ columnChoiceConfigs: dataViewConfig.value?.columnChoiceConfigs, contentAuditConfig: dataViewConfig.value?.contentAuditConfig })
);
const ignoredColumnIndexes = computed(
    () => new Set(constructIgnoredColumnIndexes({ columnChoiceConfigs: dataViewConfig.value?.columnChoiceConfigs, contentAuditConfig: dataViewConfig.value?.contentAuditConfig }))
); // The load left these out.

// ── Store
const investigateState = shallowRef<InvestigateState>({ typeId: 'opening' });
const loadDuration = ref<number>(); // How long this panel's last finished load took, in milliseconds. A load from an earlier visit has none.
const loadedByteCount = ref<number>(); // Undefined from a source not read as bytes.
const loadedRecordCount = ref(0);
const loadTotalRecordCount = ref<number>(); // The records in the source, from one that is a store, which counts them as the load starts.
const loadElapsedDuration = ref(0); // Counts up while loading, and holds the time a stopped load ran.
const loadStartedAt = ref(0);
const loadIsAbandoned = ref(false); // Set on leaving the panel, so the stopped load is not shown as a failure.
const loadIsStopped = ref(false); // Set by 'Stop', so the stopped load is shown as stopped, not as a failure.
const loadRequestId = ref<string>(); // Names the running load, so stopping it stops nothing else.
const loadVersion = ref(0); // Counts loads, so the table drops the records it holds after each one.
const firstPageColumnWidths = shallowRef<{ dataSourceId: string; widths: number[] }>(); // Measured once per load, so scrolling back cannot move the columns.
const storedRecordCount = ref<number>(); // From the store as the table reads it, so a load from an earlier visit has a count too.

// ── Take Over ─ Using the store here closes it in the tab or window that has it, which loses the records loaded there
// but not saved, so the user is asked first.
const { cancel: cancelTakeOver, confirm: confirmTakeOver, isRevealed: takeOverConfirmIsOpen, reveal: revealTakeOverConfirm } = useConfirmDialog();

// ── Overlays ─ Transform and a column's detail cover the records one at a time.
const selectedColumnIndex = ref<number>(); // The column whose detail is showing over the records.
const tableComponent = useTemplateRef<{ scrollColumnIntoView: (columnId: string) => void }>('table'); // Typed by what it exposes, because 'Table' is generic.
const transformIsOpen = ref(false);
const selectedColumnValueCounts = shallowRef<{ columnIndex: number; dataSourceId: string | undefined; valueCounts: DataViewColumnValueCounts }>(); // From the store, for a column the audit stopped counting.

// ── Item Change ─ Whether the data view's item has changed in its source since the data view last read it.
const { ignoreItemChange, itemChangedAt, itemChangeIsShown } = useItemChange(dataViewConfig);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const storeConnectorId = computed(() => resolveStoreConnectorId(dataViewConfig.value)); // Chosen on the item step or here, or else the default store.
const invalidValueCounts = computed(() => (dataViewConfig.value == null ? [] : (findDataViewInvalidValueCounts(dataViewConfig.value, draftIsCurrent.value) ?? []))); // Kept with the load, so they show on every visit. A load made before they were kept has none.
const storeConfigs = computed(() => listDataViewStoreConfigs()); // With the planned stores, which are listed but cannot be chosen yet.
const storeIsChoosable = computed(() => storeConfigs.value.filter((storeConfig) => !storeConfig.isPlanned).length > 1);
const currentStoreConfig = computed(() => storeConfigs.value.find((storeConfig) => storeConfig.id === storeConnectorId.value));
const defaultStoreConfig = computed(() => storeConfigs.value.find((storeConfig) => storeConfig.id === INVESTIGATE_STORE_CONNECTOR_ID));
const storeIsAuto = computed(() => dataViewConfig.value?.storeConnectorId == null); // No store chosen, so the data view uses the default one.

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

// ── Status ─ What the load read, while it runs, after a stop and once it is done, as the audit shows on the item step. A
// finished load read the whole item, so it says 'all' and its bar is full. While it runs, and after a stop, the bar shows
// the share of the item read, when the item's size is known and the source reports its bytes. The time counts up in
// whole seconds, then shows the load's own total, which an earlier visit's load only has while the page stays open.
const loadTimingParts = computed(() => {
    const loadTiming = dataViewConfig.value == null ? undefined : findDataViewLoadTiming(dataViewConfig.value.id);
    return loadTiming == null ? undefined : constructLoadTimingParts(loadTiming);
});
// A source read as bytes is measured against its size. A source that is a store has no size, so it is measured in
// records against the total the store counted. Both are capped, because a source can grow while it is read.
const loadPercentage = computed(() => {
    const itemSize = dataViewConfig.value?.connectionNodeConfig?.size ?? 0;
    if (itemSize > 0 && loadedByteCount.value != null) return Math.min((loadedByteCount.value / itemSize) * 100, 100);
    const totalRecordCount = loadTotalRecordCount.value ?? 0;
    return totalRecordCount > 0 ? Math.min((loadedRecordCount.value / totalRecordCount) * 100, 100) : undefined;
});
const loadStatus = computed(() => {
    const { typeId } = investigateState.value;
    if (typeId === 'loading' || typeId === 'stopped') {
        const records = constructRecordsText(loadedRecordCount.value);
        const percentageText = loadPercentage.value == null ? undefined : formatStatusPercentage(loadPercentage.value);
        const text = typeId === 'loading' ? constructRunningLoadText(records, percentageText) : constructStoppedLoadText(records, percentageText);
        const shortText = percentageText == null ? records : t(TEXT, 'load.short.text', { percentage: percentageText, records });
        return { isComplete: false, percentage: loadPercentage.value, shortText, text };
    }
    if (typeId !== 'ready' || storedRecordCount.value == null) return;
    const recordCount = storedRecordCount.value;
    const shortText = recordCount > 1 ? t(TEXT, 'load.short.complete.text', { records: constructRecordsText(recordCount) }) : constructRecordsText(recordCount);
    return { isComplete: true, percentage: 100, shortText, text: constructLoadedText(recordCount, loadTimingParts.value?.total ?? loadDuration.value) };
});
const loadProgress = computed(() => {
    const status = loadStatus.value;
    if (status?.percentage == null) return;
    return {
        isComplete: status.isComplete,
        isRunning: investigateState.value.typeId === 'loading',
        label: t(TEXT, 'load.aria'),
        percentage: status.percentage,
        valueText: status.text
    };
});

// ── Table ─ One column for each of the data view's columns, except those the user chose to ignore, which the load left
// out. Headers and widths stay by the column's position, so they match the column choices and the detail panel.
const columnHeaders = computed(() => columnConfigs.value.map((columnConfig, index) => columnConfig.label[localeId.value] ?? columnConfig.label.en ?? String(index + 1)));
const columnDefinitions = computed<ColumnDef<TableFeatureSet, DisplayRow>[]>(() =>
    columnConfigs.value
        .map((_columnConfig, index) => (ignoredColumnIndexes.value.has(index) ? undefined : index))
        .filter((index) => index !== undefined)
        .map((index) => ({ accessorKey: constructColumnKey(index), header: columnHeaders.value[index], size: firstPageColumnWidths.value?.widths[index] ?? COLUMN_WIDTH_PX }))
);

// Unit columns that found no unit start hidden, and the column picker shows them.
const hiddenColumnIds = computed(() =>
    columnConfigs.value.map((columnConfig, index) => (isEmptyUnitColumn(columnConfig) ? constructColumnKey(index) : undefined)).filter((columnId) => columnId !== undefined)
);

// The records are read a block at a time as the table scrolls.
const dataSource = computed<DataSource<DisplayRow>>(() => {
    const tablePath = dataViewConfig.value == null ? undefined : resolveDataViewTablePath(dataViewConfig.value, draftIsCurrent.value);
    const storedColumnConfigs = dataViewConfig.value == null ? [] : constructStoredColumnConfigs(dataViewConfig.value);
    const queriedStoreConnectorId = storeConnectorId.value;
    const dataSourceId = `${tablePath ?? ''}|${String(loadVersion.value)}`;
    return {
        id: dataSourceId,
        rowCount: undefined,
        getRows: async (startRow: number, endRow: number): Promise<{ rows: DisplayRow[]; totalCount: number }> => {
            if (tablePath == null) return { rows: [], totalCount: 0 };
            try {
                const query = { aggregates: [], filters: [], groupColumnIndexes: [], limit: endRow - startRow, offset: startRow, sorts: [] };
                const { records, totalCount } = await queryDataViewRecords(queriedStoreConnectorId, tablePath, storedColumnConfigs, query);
                const rows = records.map((storeRecord) => constructDisplayRow(placeLoadedValues(storeRecord, columnConfigs.value.length, ignoredColumnIndexes.value)));
                if (startRow === 0) fitColumnsToFirstPage(dataSourceId, rows);
                storedRecordCount.value = totalCount;
                return { rows, totalCount };
            } catch (error) {
                if (!didShowStoreError(error)) {
                    raiseAppFailure(new AppError("Failed to read the data view's records.", 'dpuse-app.InvestigateDataPanel', { data: { typeId: 'handled' }, cause: error }));
                }
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
        if (columnConfig.derivedFromColumnIndex != null) indexes.set(columnConfig.derivedFromColumnIndex, index);
    }
    return indexes;
});
const percentageColumnIndexes = computed(
    () => new Set([...unitColumnIndexes.value].filter(([, unitIndex]) => (columnConfigs.value[unitIndex]?.validFormats['%'] ?? 0) > 0).map(([sourceIndex]) => sourceIndex))
);

// ── Number Formats ─ One for each column. Every number shows at least its column's most decimals, so the decimal points
// line up. The maximum is high because a partial audit can miss a longer value, which must never be rounded. No grouping,
// because a number can be an id.
const numberFormats = computed(() =>
    columnConfigs.value.map((columnConfig) => {
        const minimumFractionDigits = columnConfig.validMaxDecimals ?? 0;
        return new Intl.NumberFormat(localeId.value, { maximumFractionDigits: Math.max(minimumFractionDigits, MAX_FRACTION_DIGITS), minimumFractionDigits, useGrouping: false });
    })
);

// ── Column Detail ─ Read only, from the reading and audit the data view saved, because changing how a column is read
// would make the loaded records out of date. The choices show as they are, each as its one option, and link to the item
// step, where they can be changed. A column with more different values than the audit counts gets its counts from the
// store, which holds every value.
const itemReading = computed((): ItemReading | undefined => {
    const { readingConfig, sampleConfig } = dataViewConfig.value ?? {};
    if (readingConfig == null || sampleConfig == null) return undefined;
    const storeCounts = selectedColumnValueCounts.value?.dataSourceId === dataSource.value.id ? selectedColumnValueCounts.value : undefined;
    const readingColumnConfigs = columnConfigs.value.map((columnConfig, index) =>
        index === storeCounts?.columnIndex ? { ...columnConfig, ...storeCounts.valueCounts, validCountsAreEstimated: undefined } : columnConfig
    );
    return { ...readingConfig, ...sampleConfig, columnConfigs: readingColumnConfigs };
});
const detailColumnIndexes = computed(() =>
    columnConfigs.value
        .map((columnConfig, index) => (isDerivedColumn(columnConfig) || ignoredColumnIndexes.value.has(index) ? undefined : index))
        .filter((index) => index !== undefined)
); // A derived column only holds values for another, and an ignored one was not loaded.
// What each column's values are, for the bar on its tab. From the audit, so the bar says how many records it covers.
const columnValueCounts = computed(() => (itemReading.value == null ? [] : constructColumnValueCounts(itemReading.value)));
// The marks on each column's tab, as on the item step: the facts its Overview lists, under the same rules, and whether
// the user chose its type.
const columnFacts = computed((): ColumnFacts[] => {
    const reading = itemReading.value;
    if (reading == null) return [];
    const isAuditComplete = dataViewConfig.value?.contentAuditConfig?.isComplete === true;
    return columnConfigs.value.map((_columnConfig, index) => constructColumnFacts(reading, index, findDetectedColumnType(index), isAuditComplete));
});
const chosenColumnTypes = computed(() => constructChosenColumnTypes(dataViewConfig.value));
// The columns the toolbar's search can find. One marked by a load's values that did not fit is the one to check.
const columnSearchOptions = computed((): ColumnSearchOption[] =>
    detailColumnIndexes.value.map((columnIndex) => ({
        id: String(columnIndex),
        label: columnHeaders.value[columnIndex],
        needsAttention: (invalidValueCounts.value[columnIndex] ?? 0) > 0
    }))
);
const selectedColumnStepIndex = computed(() => {
    const stepIndex = selectedColumnIndex.value == null ? -1 : detailColumnIndexes.value.indexOf(selectedColumnIndex.value);
    return stepIndex === -1 ? undefined : stepIndex;
});
const selectedColumnConfig = computed(() => (selectedColumnIndex.value == null ? undefined : columnConfigs.value[selectedColumnIndex.value]));
const selectedDetectedColumnType = computed((): ColumnType | undefined => (selectedColumnIndex.value == null ? undefined : findDetectedColumnType(selectedColumnIndex.value)));
const selectedColumnTypeOptions = computed((): SelectOption[] =>
    selectedColumnConfig.value == null ? [] : [{ id: constructColumnTypeId(selectedColumnConfig.value), label: constructColumnTypeLabel(selectedColumnConfig.value) }]
);
// A column of dates or date-times always shows its order. Auto stands for a column whose dates read only one way.
const selectedDateOrderOptions = computed((): SelectOption[] => {
    const columnConfig = selectedColumnConfig.value;
    if (columnConfig?.dataTypeId !== 'temporal' || (columnConfig.dataSubtypeId !== 'date' && columnConfig.dataSubtypeId !== 'dateTime')) return [];
    const { dateOrderId } = columnConfig;
    if (dateOrderId == null) return [{ id: 'auto', label: t(TEXT, 'dateOrder.auto.label') }];
    return [{ id: dateOrderId, label: t(TEXT, dateOrderId === 'dayFirst' ? 'dateOrder.dayFirst.label' : 'dateOrder.monthFirst.label') }];
});
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
const selectedBlankValueReading = computed(() => {
    if (selectedColumnConfig.value?.dataTypeId !== 'string') return;
    return selectedColumnConfig.value.blankValuesAreEmpty === true ? 'empty' : 'text';
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

useIntervalFn(() => {
    if (investigateState.value.typeId === 'loading') loadElapsedDuration.value = performance.now() - loadStartedAt.value;
}, 500);

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

// The panel holds its store for as long as it shows it, and lets go when it leaves or the data view moves to another
// store. The last screen in this tab to let go closes the store, so another tab can use it.
watch(
    storeConnectorId,
    (heldStoreConnectorId, _previousStoreConnectorId, onCleanup) => {
        const releaseStore = holdStore(heldStoreConnectorId);
        onCleanup(() => {
            void releaseStore().catch((error: unknown) => {
                raiseFailure(new AppError('Failed to close the store.', 'dpuse-app.InvestigateDataPanel', { data: { typeId: 'handled' }, cause: error }));
            });
        });
    },
    { immediate: true }
);

// Another tab has taken this store, so it says so at once, rather than when the table next reads.
watch(storeTakeover, (takeover) => {
    if (takeover?.connectorId !== storeConnectorId.value || !['loading', 'opening', 'ready'].includes(investigateState.value.typeId)) return;
    investigateState.value = { typeId: 'heldElsewhere' };
});

// The records can go while they are on screen, such as when Manage Data deletes the store's database, or another tab
// clears local storage.
watch(
    () => dataViewConfig.value != null && isDataViewLoaded(dataViewConfig.value, draftIsCurrent.value),
    (isLoaded) => {
        if (isLoaded || investigateState.value.typeId !== 'ready') return;
        investigateState.value = { typeId: 'notLoaded' };
    }
);

// The audit stops counting a column's values past a limit and keeps none of its counts. When such a column's detail
// opens, the store counts them, and again after a new load. A count that arrives after the user has moved on is dropped.
watch([selectedColumnIndex, (): string | undefined => dataSource.value.id], async ([columnIndex, dataSourceId]) => {
    const columnConfig = columnIndex == null ? undefined : columnConfigs.value[columnIndex];
    const hasCounts = columnConfig?.validFrequentValues == null || Object.keys(columnConfig.validFrequentValues).length > 0 || columnConfig.validDistinctValueCount != null;
    const isCounted = hasCounts && columnConfig?.validCountsAreEstimated !== true; // Estimates are replaced by the store's exact counts too.
    const tablePath = dataViewConfig.value == null ? undefined : resolveDataViewTablePath(dataViewConfig.value, draftIsCurrent.value);
    if (tablePath == null || columnIndex == null || isCounted || dataViewConfig.value == null) return;
    try {
        const storedColumnIndex = columnIndex - [...ignoredColumnIndexes.value].filter((ignoredColumnIndex) => ignoredColumnIndex < columnIndex).length; // The store's table leaves ignored columns out.
        const valueCounts = await queryDataViewColumnValueCounts(storeConnectorId.value, tablePath, constructStoredColumnConfigs(dataViewConfig.value), storedColumnIndex);
        if (selectedColumnIndex.value === columnIndex && dataSource.value.id === dataSourceId) selectedColumnValueCounts.value = { columnIndex, dataSourceId, valueCounts };
    } catch (error) {
        if (didShowStoreError(error)) return;
        raiseFailure(new AppError('Failed to count the column’s values.', 'dpuse-app.InvestigateDataPanel', { data: { typeId: 'handled' }, cause: error }));
    }
});

// Leaving stops a load rather than letting it run on unseen. Letting go of the store, which frees it for another tab, is
// the watcher on the store's id.
onBeforeUnmount(() => {
    const leftDataViewConfig = dataViewConfig.value;
    if (leftDataViewConfig == null || investigateState.value.typeId !== 'loading' || loadRequestId.value == null) return;

    loadIsAbandoned.value = true;
    void abortDataViewRecordLoad(leftDataViewConfig, loadRequestId.value).catch((error: unknown) => {
        raiseFailure(new AppError('Failed to stop loading the records.', 'dpuse-app.InvestigateDataPanel', { data: { typeId: 'handled' }, cause: error }));
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

// For a store another tab or window holds, including one the user cannot find. That tab closes its store.
async function handleTakeOverStore(): Promise<void> {
    const { isCanceled } = await revealTakeOverConfirm();
    if (isCanceled) return;

    void openAndLoad(false, true);
}

// A refresh starts with a fresh preview and audit, which the item step reads. So it opens the item step and asks it to
// refresh, and the item step opens Explore again to load the records once the columns are known to be the same.
function handleRefreshChangedItem(): void {
    void ignoreReportedNavigationFailure(
        router.push({ name: 'item', params: { dataViewId: route.params.dataViewId }, query: route.query, state: { itemRefreshIsRequested: true } })
    );
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

// A choice becomes the data view's unsaved choice, as on the item step. No store means Auto. A different store takes the
// records, so they are loaded into it, and the panel lets go of the old store so another tab can use it. A choice that
// leaves the records where they are, such as Auto while the default store already holds them, loads nothing.
function handleChooseStore(chosenStoreConnectorId?: string): void {
    const config = dataViewConfig.value;
    if (config == null || chosenStoreConnectorId === config.storeConnectorId) return;
    const storeIsChanged = resolveStoreConnectorId({ storeConnectorId: chosenStoreConnectorId }) !== storeConnectorId.value;
    changeDataView({ ...config, storeConnectorId: chosenStoreConnectorId });
    if (storeIsChanged) void openAndLoad(true);
}

function handleStopLoad(): void {
    if (dataViewConfig.value == null || loadRequestId.value == null) return;
    loadIsStopped.value = true;
    void abortDataViewRecordLoad(dataViewConfig.value, loadRequestId.value).catch((error: unknown) => {
        raiseFailure(new AppError('Failed to stop loading the records.', 'dpuse-app.InvestigateDataPanel.handleStopLoad', { data: { typeId: 'handled' }, cause: error }));
    });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A data view is loaded the first time it is investigated, and again when its columns have changed or the user asks.
// Later visits read the records already stored.
async function openAndLoad(isReloaded: boolean, shouldTakeOver = false): Promise<void> {
    const openedDataViewConfig = dataViewConfig.value;
    if (openedDataViewConfig == null || investigateState.value.typeId === 'loading') return;
    investigateState.value = { typeId: 'opening' };
    const sourceStoreConnectorId = findSourceStoreConnectorId(openedDataViewConfig.connectionId);
    const releaseSourceStore = sourceStoreConnectorId == null ? undefined : holdStore(sourceStoreConnectorId); // The load opens a source that is itself a store, so the panel holds it while the load runs.
    try {
        if (shouldTakeOver) await takeOverSourceStore(sourceStoreConnectorId);
        const storeStateId = await openDataViewStore(resolveStoreConnectorId(openedDataViewConfig), draftIsCurrent.value ? openedDataViewConfig.id : undefined, shouldTakeOver);
        if (storeStateId !== 'ready') {
            investigateState.value = { typeId: storeStateId };
            return;
        }
        if (isReloaded || !isDataViewLoaded(openedDataViewConfig, draftIsCurrent.value)) {
            investigateState.value = { typeId: 'loading' };
            loadDuration.value = undefined;
            loadedByteCount.value = undefined;
            loadedRecordCount.value = 0;
            loadTotalRecordCount.value = undefined;
            loadElapsedDuration.value = 0;
            loadIsStopped.value = false;
            loadRequestId.value = crypto.randomUUID();
            storedRecordCount.value = undefined;
            loadStartedAt.value = performance.now();
            const { columnsHaveChanged, recordCount } = await loadDataViewRecords(
                openedDataViewConfig,
                draftIsCurrent.value,
                (recordCount, byteCount, totalRecordCount) => {
                    loadedByteCount.value = byteCount;
                    loadedRecordCount.value = recordCount;
                    loadTotalRecordCount.value = totalRecordCount;
                },
                loadRequestId.value
            );
            if (columnsHaveChanged) {
                investigateState.value = { typeId: 'columnsChanged' };
                return;
            }
            loadDuration.value = performance.now() - loadStartedAt.value;
            storedRecordCount.value = recordCount;
            loadVersion.value++;
        }
        investigateState.value = { typeId: 'ready' };
    } catch (error) {
        if (loadIsAbandoned.value) return;
        if (loadIsStopped.value) {
            loadElapsedDuration.value = performance.now() - loadStartedAt.value;
            investigateState.value = { typeId: 'stopped' };
            return;
        }
        if (didShowStoreError(error)) return;
        const failure = raiseFailure(
            new AppError("Failed to load the data view's records.", 'dpuse-app.InvestigateDataPanel.openAndLoad', { data: { typeId: 'handled' }, cause: error })
        );
        investigateState.value = { typeId: 'failed', failure };
    } finally {
        void releaseSourceStore?.().catch((error: unknown) => {
            raiseFailure(new AppError('Failed to close the source store.', 'dpuse-app.InvestigateDataPanel.openAndLoad', { data: { typeId: 'handled' }, cause: error }));
        });
    }
}

// A source such as SQLite keeps its data in a store of its own. Undefined for any other source.
function findSourceStoreConnectorId(connectionId: string | undefined): string | undefined {
    const sourceConnectionConfig = findConnectionLocalisedConfig(connectionId);
    return isStoreConnection(sourceConnectionConfig) ? sourceConnectionConfig?.connectorConfig.id : undefined;
}

// Taking over takes the source's store too, because it may be the store another tab has.
async function takeOverSourceStore(sourceStoreConnectorId: string | undefined): Promise<void> {
    if (sourceStoreConnectorId != null) await openStore(sourceStoreConnectorId, true);
}

// A store another tab has taken, or a table the store no longer has, is a state the panel shows rather than a failure.
// A missing table's load is forgotten, so the data view asks to be loaded again. Returns whether it was one of these.
function didShowStoreError(error: unknown): boolean {
    switch (findStoreErrorId(error)) {
        case 'heldElsewhere':
            investigateState.value = { typeId: 'heldElsewhere' };
            return true;
        case 'notLoaded':
            if (dataViewConfig.value != null) forgetDataViewLoad(dataViewConfig.value, draftIsCurrent.value);
            investigateState.value = { typeId: 'notLoaded' };
            return true;
        default:
            return false;
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
    const widths = columnHeaders.value.map((header, index) => {
        const percentSign = percentageColumnIndexes.value.has(index) ? ' %' : ''; // Measured with its unit, so a currency or sign never covers the number.
        const values = rows.map((row) => `${row[constructUnitKey(index)] ?? ''} ${row[constructColumnKey(index)] ?? ''}${percentSign}`.trim());
        const marksWidthPx = detailColumnIndexes.value.includes(index) ? PREVIEW_COLUMN_MARKS_WIDTH_PX : 0;
        return constructFittedColumnWidth(header, values, { headerExtraPx: HEADER_MENU_WIDTH_PX + HEADER_TAB_INSET_PX + marksWidthPx }); // The headers are tabs with marks, which take room from the label.
    });
    firstPageColumnWidths.value = { dataSourceId, widths };
}

// The type the audit found for a column, before any type the user chose in its place.
function findDetectedColumnType(columnIndex: number): ColumnType | undefined {
    const auditedColumnConfig = dataViewConfig.value?.contentAuditConfig?.columns[columnIndex];
    return auditedColumnConfig == null ? undefined : { dataSubtypeId: auditedColumnConfig.dataSubtypeId, dataTypeId: auditedColumnConfig.dataTypeId };
}

function constructColumnKey(columnIndex: number): string {
    return `c${String(columnIndex)}`;
}

function readColumnIndex(columnKey: string): number {
    return Number(columnKey.slice(1));
}

// The icon for a column's type, and the type's name for screen readers, because the icon alone does not say it.
function constructColumnTypeIcon(columnIndex: number): Component | undefined {
    const columnConfig = columnConfigs.value.at(columnIndex);
    return columnConfig == null ? undefined : getColumnTypeIcon(columnConfig);
}

function constructColumnTypeText(columnIndex: number): string {
    const columnConfig = columnConfigs.value.at(columnIndex);
    return columnConfig == null ? '' : constructColumnTypeLabel(columnConfig);
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
function formatStoreValue(value: StoreValue, columnConfig: ColumnAuditConfig, numberFormat: Intl.NumberFormat | undefined): string {
    if (value == null) return '';
    if (numberFormat != null && columnConfig.dataTypeId === 'numeric' && (typeof value === 'number' || typeof value === 'bigint')) return numberFormat.format(value);
    if (value instanceof Date) {
        const formatOptions = columnConfig.dataSubtypeId == null ? undefined : DATE_FORMAT_OPTIONS[columnConfig.dataSubtypeId];
        return new Intl.DateTimeFormat(localeId.value, formatOptions ?? DATE_TIME_FORMAT_OPTIONS).format(value);
    }
    return String(value);
}

function constructRecordsText(recordCount: number): string {
    return t(TEXT, recordCount === 1 ? 'record.one.text' : 'record.other.text', { count: new Intl.NumberFormat(localeId.value).format(recordCount) });
}

function constructRunningLoadText(records: string, percentageText: string | undefined): string {
    const duration = formatElapsedDuration(loadElapsedDuration.value);
    return percentageText == null
        ? t(TEXT, 'load.running.text', { duration, records })
        : t(TEXT, 'load.running.percentage.text', { duration, percentage: percentageText, records });
}

function constructStoppedLoadText(records: string, percentageText: string | undefined): string {
    const duration = formatFinishedDuration(loadElapsedDuration.value);
    return percentageText == null ? t(TEXT, 'load.stop.text', { duration, records }) : t(TEXT, 'load.stop.percentage.text', { duration, percentage: percentageText, records });
}

// A load from an earlier visit has no time once the page has been reloaded, so it says only how many records it loaded.
// The store is not named, because the table's toolbar shows it.
function constructLoadedText(recordCount: number, duration: number | undefined): string {
    const records = constructRecordsText(recordCount);
    const countId = constructCountId(recordCount);
    return duration == null
        ? t(TEXT, `load.untimed.${countId}.text`, { records })
        : t(TEXT, `load.complete.${countId}.text`, { duration: formatFinishedDuration(duration), records });
}

// Which form of a message fits the count: none, one, or more than one.
function constructCountId(count: number): 'one' | 'other' | 'zero' {
    if (count === 0) return 'zero';
    return count === 1 ? 'one' : 'other';
}
</script>

<template>
    <div class="relative flex min-h-0 flex-1 flex-col" data-region="InvestigateDataPanel">
        <!-- Opening the store takes a moment with nothing to count, so it has a busy bar. A load shows its progress in the
             status bar. -->
        <BusyBar v-if="investigateState.typeId === 'opening'" />

        <ErrorNotice v-if="investigateState.typeId === 'failed'" :failures="[investigateState.failure]" @retry="handleRetry" />

        <template v-else>
            <!-- Item Changed ─ The data view, and so its records, are from an earlier version of the item. The user refreshes
                 the data view from the changed item, or ignores the change. Not while loading, so a load is never cut off. -->
            <ItemChangedNotice
                v-if="itemChangeIsShown && itemChangedAt != null"
                :changed-at="itemChangedAt"
                :is-disabled="investigateState.typeId === 'loading'"
                @ignore="ignoreItemChange"
                @refresh="handleRefreshChangedItem"
            />

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
                    <!-- Actions ─ In the table's toolbar, beside its column picker. -->
                    <template #toolbar-end>
                        <!-- Column Search ─ Opens over the whole toolbar, as on the item step. -->
                        <ColumnSearch v-if="columnSearchOptions.length > 1" :options="columnSearchOptions" @select="handleSelectColumn" />
                        <ActionWrapper
                            aria-controls="dpuse-transform-panel"
                            :aria-expanded="transformIsOpen"
                            class="inline-flex items-center gap-x-1 text-accent hover:underline"
                            @click="handleToggleTransform"
                        >
                            <SlidersHorizontalIcon aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
                            {{ t(TEXT, 'transform.label') }}
                        </ActionWrapper>
                        <!-- Store ─ Shows where the records are, in italics while it is the default no one chose. A menu of the
                             stores when there is more than one, so the records can move to another store without going back
                             to the item step. Auto comes first, as on the item step, and names the default store. Choosing
                             a different store loads the records into it. -->
                        <Menu.Root v-if="storeIsChoosable" class="flex">
                            <template #trigger="{ triggerAttributes }">
                                <ActionWrapper
                                    v-bind="triggerAttributes"
                                    :aria-label="t(TEXT, 'store.aria', { label: currentStoreConfig?.label ?? '' })"
                                    class="inline-flex items-center gap-x-1 text-accent hover:underline"
                                >
                                    <span class="flex size-5 flex-none">
                                        <ConfigIcon class="size-full" :icon="currentStoreConfig?.icon" :icon-dark="currentStoreConfig?.iconDark" />
                                    </span>
                                    <span :class="{ italic: storeIsAuto }">{{ currentStoreConfig?.label }}</span>
                                    <ChevronDownIcon aria-hidden="true" class="size-3.5 flex-none" :stroke-width="2" />
                                </ActionWrapper>
                            </template>
                            <Menu.Content :label="t(TEXT, 'load.again.store.aria')" placement="bottom-end">
                                <Menu.Item :is-checked="storeIsAuto" kind="radio" @select="handleChooseStore()">
                                    <template #icon>
                                        <span class="flex size-5 flex-none">
                                            <ConfigIcon class="size-full" :icon="defaultStoreConfig?.icon" :icon-dark="defaultStoreConfig?.iconDark" />
                                        </span>
                                    </template>
                                    {{ t(TEXT, 'store.auto.label', { label: defaultStoreConfig?.label ?? '' }) }}
                                </Menu.Item>
                                <Menu.Separator />
                                <Menu.Item
                                    v-for="storeConfig in storeConfigs"
                                    :key="storeConfig.id"
                                    :is-checked="!storeIsAuto && storeConfig.id === storeConnectorId"
                                    :is-disabled="storeConfig.isPlanned"
                                    kind="radio"
                                    @select="handleChooseStore(storeConfig.id)"
                                >
                                    <template #icon>
                                        <span class="flex size-5 flex-none">
                                            <ConfigIcon
                                                class="size-full"
                                                :class="{ 'opacity-60 grayscale': storeConfig.isPlanned }"
                                                :icon="storeConfig.icon"
                                                :icon-dark="storeConfig.iconDark"
                                            />
                                        </span>
                                    </template>
                                    {{ storeConfig.label }}
                                </Menu.Item>
                            </Menu.Content>
                        </Menu.Root>
                        <!-- With one store there is no choice, so it only shows where the records are. -->
                        <span v-else-if="currentStoreConfig" class="inline-flex items-center gap-x-1 text-muted">
                            <span class="flex size-5 flex-none">
                                <ConfigIcon class="size-full" :icon="currentStoreConfig.icon" :icon-dark="currentStoreConfig.iconDark" />
                            </span>
                            {{ currentStoreConfig.label }}
                        </span>
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
                                    label: String(columnHeaders[readColumnIndex(columnId)])
                                })
                            "
                            @click="handleToggleColumnDetail(readColumnIndex(columnId))"
                            >{{ columnHeaders[readColumnIndex(columnId)] }}</ActionWrapper
                        >
                        <span v-else class="min-w-0 flex-1 truncate text-sm font-medium text-muted">{{ columnHeaders[readColumnIndex(columnId)] }}</span>
                    </template>
                    <!-- Marks and Value Bar ─ On each tab that has a detail, as on the item step: the column's key, unique and
                         mandatory marks and its type icon after its name, and its value bar along the bottom. The bar
                         shows what the column's values are and marks where one column ends and the next starts. The
                         selected tab has none, so its white runs into the detail below, whose Overview shows the same
                         counts. The bar is placed on the header cell, so it sits here only to be in the cell. -->
                    <template #header-label-end="{ columnId }">
                        <template v-if="detailColumnIndexes.includes(readColumnIndex(columnId))">
                            <ColumnTabMarks
                                :column-facts="columnFacts[readColumnIndex(columnId)] ?? { isKey: undefined, isMandatory: undefined, isUnique: undefined }"
                                :is-type-chosen="chosenColumnTypes[String(readColumnIndex(columnId))] != null"
                                :type-icon="constructColumnTypeIcon(readColumnIndex(columnId))"
                                :type-text="constructColumnTypeText(readColumnIndex(columnId))"
                            />
                            <ColumnValueBar
                                v-if="readColumnIndex(columnId) !== selectedColumnIndex && columnValueCounts[readColumnIndex(columnId)]"
                                :column-label="String(columnHeaders[readColumnIndex(columnId)])"
                                :column-value-counts="columnValueCounts[readColumnIndex(columnId)]!"
                                @click="handleToggleColumnDetail(readColumnIndex(columnId))"
                            />
                        </template>
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
                            <header class="flex h-10 flex-none items-center gap-x-3 border-b border-separator px-page text-sm">
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
                <!-- Column Detail ─ Slides down from under the column names, 76px down past the 40px toolbar and the 36px
                     tab row, so the tabs stay in reach and another one can be chosen, as on the item step. -->
                <div class="pointer-events-none absolute inset-x-0 top-19 bottom-0 z-10 overflow-hidden">
                    <Transition name="dpuse-slide-down">
                        <ColumnDetail
                            v-if="selectedColumnIndex != null && itemReading != null"
                            class="pointer-events-auto absolute inset-0 bg-surface shadow-md"
                            :blank-value-reading="selectedBlankValueReading"
                            :column-index="selectedColumnIndex"
                            :date-order-options="selectedDateOrderOptions"
                            :date-order-value="selectedDateOrderOptions[0]?.id"
                            :decimal-separator-options="selectedDecimalSeparatorOptions"
                            :decimal-separator-value="selectedDecimalSeparatorOptions[0]?.id"
                            :detected-column-type="selectedDetectedColumnType"
                            :has-next-column="selectedColumnStepIndex != null && selectedColumnStepIndex < detailColumnIndexes.length - 1"
                            :has-previous-column="selectedColumnStepIndex != null && selectedColumnStepIndex > 0"
                            :is-audit-complete="dataViewConfig?.contentAuditConfig?.isComplete === true"
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
                        </ColumnDetail>
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
                <ActionWrapper v-if="investigateState.typeId === 'heldElsewhere'" class="text-accent hover:underline" @click="handleTakeOverStore">{{
                    t(TEXT, 'store.takeOver.label')
                }}</ActionWrapper>
            </div>
        </template>

        <!-- Status Bar ─ What the load read on the left, and a warning on the right, in colour, when the column types
             came from a partial audit. Screen readers always hear the warning in full. The running figures change too
             often to read out, so only the progress bar announces them. -->
        <StatusBar :progress="loadProgress">
            <template v-if="loadStatus">
                <span aria-hidden="true">{{ viewportIsWide ? loadStatus.text : loadStatus.shortText }}</span>
                <span class="sr-only">{{ loadStatus.text }}</span>
            </template>
            <template v-if="investigateState.typeId === 'ready' && columnsAreFromPartialAudit" #end="{ isShort }">
                <TriangleAlertIcon aria-hidden="true" class="inline size-3.5 align-middle text-warning-text" :stroke-width="2" />
                <span aria-hidden="true" class="ml-1 text-warning-text">{{ t(TEXT, isShort ? 'load.partialAuditTypes.short.text' : 'load.partialAuditTypes.text') }}</span>
                <span class="sr-only">{{ t(TEXT, 'load.partialAuditTypes.text') }}</span>
            </template>
        </StatusBar>

        <ConfirmDialog
            :confirm-label="t(TEXT, 'store.takeOver.label')"
            confirm-variant="guarded"
            :is-open="takeOverConfirmIsOpen"
            :message="t(TEXT, 'store.takeOver.confirm.text')"
            :title="t(TEXT, 'store.takeOver.confirm.title')"
            @cancel="cancelTakeOver"
            @confirm="confirmTakeOver"
        />
    </div>
</template>
