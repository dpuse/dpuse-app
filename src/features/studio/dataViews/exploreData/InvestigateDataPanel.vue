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
import type { DataSource } from '@/composables/useDataWindow';
import { TEXT } from './InvestigateDataPanel_.json';
import { abortDataViewRecordLoad, closeDataViewStore, isDataViewLoaded, loadDataViewRecords, openDataViewStore, queryDataViewRecords } from '@/features/studio/dataViews/_dataViewStore';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';
import { localeId, t } from '@/state/locale';
import { resolveDataViewIdParameter, useDataView } from '@/features/studio/dataViews/_dataViews';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import BusyBar from '@/components/ui/BusyBar.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import Table from '@/components/ui/table/Table.vue';
import type { TableFeatureSet } from '@/components/ui/table/tableFeatures';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Where investigating the data view has got to. 'heldElsewhere' and 'unavailable' come from the store as it opens.
type InvestigateState =
    | { typeId: 'auditRequired' }
    | { typeId: 'failed'; failure: AppFailure }
    | { typeId: 'heldElsewhere' }
    | { typeId: 'loading' }
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
    auditRequired: 'audit.required.text',
    heldElsewhere: 'store.heldElsewhere.text',
    stopped: 'load.stopped.text',
    unavailable: 'store.unavailable.text'
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

// ── Data View
const { data: dataViewConfig } = useDataView(() => resolveDataViewIdParameter(route.params.dataViewId));
const auditedColumnConfigs = computed(() => dataViewConfig.value?.contentAuditConfig?.columns ?? []);

// ── Store
const investigateState = shallowRef<InvestigateState>({ typeId: 'opening' });
const loadedRecordCount = ref(0);
const loadIsAbandoned = ref(false); // Set on leaving the panel, so the stopped load is not shown as a failure.
const loadIsStopped = ref(false); // Set by 'Stop', so the stopped load is shown as stopped, not as a failure.
const loadVersion = ref(0); // Counts loads, so the table drops the records it holds after each one.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const messageKey = computed(() => MESSAGE_KEYS[investigateState.value.typeId]);

const loadPendingText = computed(() => t(TEXT, 'load.pending.text', { count: new Intl.NumberFormat(localeId.value).format(loadedRecordCount.value) }));

// ── Table ─ One column for each audited column, named as the audit named it.
const columnDefinitions = computed<ColumnDef<TableFeatureSet, DisplayRow>[]>(() =>
    auditedColumnConfigs.value.map((columnConfig, index) => ({
        accessorKey: constructColumnKey(index),
        header: columnConfig.label[localeId.value] ?? columnConfig.label.en ?? String(index + 1),
        size: 160
    }))
);

// The records are read a block at a time as the table scrolls.
const dataSource = computed<DataSource<DisplayRow>>(() => {
    const dataViewId = dataViewConfig.value?.id;
    return {
        id: `${dataViewId ?? ''}|${String(loadVersion.value)}`,
        rowCount: undefined,
        getRows: async (startRow: number, endRow: number): Promise<{ rows: DisplayRow[]; totalCount: number }> => {
            if (dataViewId == null) return { rows: [], totalCount: 0 };
            try {
                const query = { aggregates: [], filters: [], groupColumnIndexes: [], limit: endRow - startRow, offset: startRow, sorts: [] };
                const { records, totalCount } = await queryDataViewRecords(dataViewId, query);
                return { rows: records.map((storeRecord) => constructDisplayRow(storeRecord)), totalCount };
            } catch (error) {
                raiseAppFailure(new AppError("Failed to read the data view's records.", 'dpuse-app.InvestigateDataPanel', { typeId: 'handled' }, { cause: error }));
                return { rows: [], totalCount: 0 };
            }
        }
    };
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Opens the store once the data view is audited, and again after a new audit, which needs a new load.
watch(
    () => dataViewConfig.value?.contentAuditConfig?.asAt,
    (auditTime) => {
        if (auditTime == null) investigateState.value = { typeId: 'auditRequired' };
        else void openAndLoad(false);
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

// A data view is loaded the first time it is investigated, and again when its audit has changed or the user asks.
// Later visits read the records already stored.
async function openAndLoad(isReloaded: boolean): Promise<void> {
    const openedDataViewConfig = dataViewConfig.value;
    if (openedDataViewConfig == null || investigateState.value.typeId === 'loading') return;
    investigateState.value = { typeId: 'opening' };
    try {
        const storeStateId = await openDataViewStore();
        if (storeStateId !== 'ready') {
            investigateState.value = { typeId: storeStateId };
            return;
        }
        if (isReloaded || !isDataViewLoaded(openedDataViewConfig)) {
            investigateState.value = { typeId: 'loading' };
            loadedRecordCount.value = 0;
            loadIsStopped.value = false;
            await loadDataViewRecords(openedDataViewConfig, (recordCount) => {
                loadedRecordCount.value = recordCount;
            });
            loadVersion.value++;
        }
        investigateState.value = { typeId: 'ready' };
    } catch (error) {
        if (loadIsAbandoned.value) return;
        if (loadIsStopped.value) {
            investigateState.value = { typeId: 'stopped' };
            return;
        }
        const failure = raiseFailure(new AppError("Failed to load the data view's records.", 'dpuse-app.InvestigateDataPanel.openAndLoad', { typeId: 'handled' }, { cause: error }));
        investigateState.value = { typeId: 'failed', failure };
    }
}

function constructColumnKey(columnIndex: number): string {
    return `c${String(columnIndex)}`;
}

function constructDisplayRow(storeRecord: StoreRecord): DisplayRow {
    const displayRow: DisplayRow = {};
    for (const [columnIndex, columnConfig] of auditedColumnConfigs.value.entries()) displayRow[constructColumnKey(columnIndex)] = formatStoreValue(storeRecord[columnIndex] ?? null, columnConfig);
    return displayRow;
}

// Each value is stored as its audited type, so a date is formatted for the locale and anything else shows as itself.
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
            <div v-if="investigateState.typeId === 'ready' || investigateState.typeId === 'loading'" class="flex h-9.25 flex-none items-center justify-end border-b border-separator px-page text-xs">
                <ActionWrapper v-if="investigateState.typeId === 'loading'" class="text-accent hover:underline" @click="handleStopLoad">{{ t(TEXT, 'load.stop.label') }}</ActionWrapper>
                <ActionWrapper v-else class="inline-flex items-center gap-x-1 text-accent hover:underline" @click="handleLoadAgain">
                    <RefreshCwIcon aria-hidden="true" class="size-4" :stroke-width="1.5" />
                    {{ t(TEXT, 'load.again.label') }}
                </ActionWrapper>
            </div>

            <!-- The usual room after the last row, less the status bar's height: the table already ends above it. -->
            <Table
                v-if="investigateState.typeId === 'ready' && auditedColumnConfigs.length > 0"
                class="flex-1"
                :column-definitions="columnDefinitions"
                :data-source="dataSource"
                scroll-area-padding-bottom="calc(var(--vertical-scroll-bottom-screen-inset) - var(--status-bar-height))"
            />
            <!-- Announced as it changes, because the count is the only sign that a long load is still going. -->
            <p v-else-if="investigateState.typeId === 'loading'" aria-live="polite" class="m-auto px-4 text-center text-sm text-muted">{{ loadPendingText }}</p>
            <div v-else-if="messageKey" class="m-auto flex flex-col items-center gap-y-2 px-4 text-center text-sm text-muted">
                <p>{{ t(TEXT, messageKey) }}</p>
                <ActionWrapper v-if="investigateState.typeId !== 'auditRequired'" class="text-accent hover:underline" @click="handleRetry">{{ t(TEXT, 'retry.label') }}</ActionWrapper>
            </div>
        </template>

        <!-- Status Bar ─ Blank for now. Keeps the table, and its horizontal scroll bar, above the bottom safe area on
             iOS, as the item preview's status bar does. -->
        <div class="mt-auto h-(--status-bar-height) w-full flex-none border-t border-separator bg-card" />
    </div>
</template>
