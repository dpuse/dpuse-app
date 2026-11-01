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
import { constructColumnSetVersion, constructLoadColumnConfigs } from '@/features/studio/dataViews/_dataViewColumns';
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

type DisplayRow = Record<string, string>; // Keyed by column position, 'c0' first, each value as the text the table shows.

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// A date shows its time only where the audited column holds one. Dates are stored in UTC and shown in UTC, because a date
// with no time zone in the file would otherwise show as the day before for anyone west of Greenwich.
const DATE_FORMAT_OPTIONS: Partial<Record<DataSubtypeId, Intl.DateTimeFormatOptions>> = {
    date: { dateStyle: 'medium', timeZone: 'UTC' },
    time: { timeStyle: 'medium', timeZone: 'UTC' }
};
const DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' };

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
        size: 160
    }))
);

// The records are read a block at a time as the table scrolls.
const dataSource = computed<DataSource<DisplayRow>>(() => {
    const dataViewId = dataViewConfig.value?.id;
    const tablePath = dataViewId == null ? undefined : resolveDataViewTablePath(dataViewId, draftIsCurrent.value);
    return {
        id: `${tablePath ?? ''}|${String(loadVersion.value)}`,
        rowCount: undefined,
        getRows: async (startRow: number, endRow: number): Promise<{ rows: DisplayRow[]; totalCount: number }> => {
            if (tablePath == null) return { rows: [], totalCount: 0 };
            try {
                const query = { aggregates: [], filters: [], groupColumnIndexes: [], limit: endRow - startRow, offset: startRow, sorts: [] };
                const { records, totalCount } = await queryDataViewRecords(tablePath, query);
                return { rows: records.map((storeRecord) => constructDisplayRow(storeRecord)), totalCount };
            } catch (error) {
                raiseAppFailure(new AppError("Failed to read the data view's records.", 'dpuse-app.InvestigateDataPanel', { typeId: 'handled' }, { cause: error }));
                return { rows: [], totalCount: 0 };
            }
        }
    };
});

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

function constructColumnKey(columnIndex: number): string {
    return `c${String(columnIndex)}`;
}

function constructDisplayRow(storeRecord: StoreRecord): DisplayRow {
    const displayRow: DisplayRow = {};
    for (const [columnIndex, columnConfig] of columnConfigs.value.entries())
        displayRow[constructColumnKey(columnIndex)] = formatStoreValue(storeRecord[columnIndex] ?? null, columnConfig);
    return displayRow;
}

// Each value is stored as its column's type, so a date is formatted for the locale and anything else shows as itself.
function formatStoreValue(value: StoreValue, columnConfig: ObjectColumnConfig): string {
    if (value == null) return '';
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
                :data-source="dataSource"
                scroll-area-padding-bottom="calc(var(--vertical-scroll-bottom-screen-inset) - var(--status-bar-height))"
            />
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
