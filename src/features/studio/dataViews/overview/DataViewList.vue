<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { defineLazyComponent } from '@/utilities/index.ts';
import { findDataViewConnection } from '@/features/studio/dataViews/_state/dataViewSummary';
import { TEXT } from './DataViewList_.json';
import { useCardRowHeight } from '@/components/ui/config/configCard';
import { localeId, t } from '@/state/locale';

// ── Static Components
import DataViewCard from './DataViewCard.vue';
import Grid from '@/components/ui/grid/Grid.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';

// ── Dynamic Components
const EmptyPlaceholder = defineLazyComponent(() => import('@/components/ui/placeholder/EmptyPlaceholder.vue'), 'EmptyPlaceholder');

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { dataViewLocalisedConfigs, isSplit, retrievalIsSettled, retrievalIsSlow, selectedDataViewId } = defineProps<{
    dataViewLocalisedConfigs: LocalisedConfig<DataViewConfig>[];
    isSplit: boolean; // The detail is showing beside the list, so the selected card's detail is already on screen.
    retrievalIsSettled: boolean; // The data views have been retrieved, or retrieving them has failed. Until then the list stays busy.
    retrievalIsSlow: boolean; // Retrieving is taking a while, so the list says so and offers a way out.
    selectedDataViewId: string | undefined;
}>();
defineEmits<{
    add: [];
    cancelRetrieval: [];
    open: [dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>];
    retryRetrieval: [];
    select: [dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>];
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Grid ─ 'rowCount' stays undefined, which keeps the grid busy, until retrieval settles either way; 0 means
// confirmed empty.
const dataViewDataSource = computed((): DataSource<LocalisedConfig<DataViewConfig>> => ({
    rowCount: retrievalIsSettled ? dataViewLocalisedConfigs.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<DataViewConfig>[] }> => Promise.resolve({ rows: dataViewLocalisedConfigs.slice(start, end) })
}));

// Cards here carry actions, which take a second row, and details naming the connection and item.
const cardRowHeight = useCardRowHeight(true, true);

// The selected card is scrolled into view, so a selection restored when the list opens can be seen. Built from the id,
// so a new object for the same data view, as a change of language gives, does not scroll the list again.
const matchSelectedRow = computed(() => {
    const id = selectedDataViewId;
    return id === undefined ? undefined : (item: LocalisedConfig<DataViewConfig>): boolean => item.id === id;
});

// ── Data View Summary ─ The connector behind each data view, keyed by data view id; undefined until a connection is
// chosen.
const dataViewConnectionsById = computed(() => new Map(dataViewLocalisedConfigs.map((config) => [config.id, findDataViewConnection(config, localeId.value)])));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleFilterByCategory(): void {
    // TODO: Filter the list to the connector category of the data view whose category was clicked.
}
</script>

<template>
    <Grid
        :add-label="t(TEXT, 'dataView.label')"
        class="flex-1"
        data-region="DataViewList"
        :data-source="dataViewDataSource"
        :is-scroll-target="matchSelectedRow"
        :row-height="cardRowHeight"
        :target-column-width="340"
        @add="$emit('add')"
    >
        <!-- Slow Retrieval ─ Below the list's busy bar. Cancel is the safe choice, so it comes first. -->
        <template #busy>
            <div v-if="retrievalIsSlow" class="mx-page mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p class="text-sm text-muted" role="status">{{ t(TEXT, 'retrieval.slow.text') }}</p>
                <div class="flex gap-2">
                    <RectangleButton @click="$emit('cancelRetrieval')">{{ t(TEXT, 'retrieval.cancel.label') }}</RectangleButton>
                    <RectangleButton @click="$emit('retryRetrieval')">{{ t(TEXT, 'retrieval.retry.label') }}</RectangleButton>
                </div>
            </div>
        </template>

        <template #default="{ item }">
            <!-- 'is-inert' ─ Beside the list, the selected card's detail is already showing, so a click on it does
                 nothing and the card does not look clickable. -->
            <DataViewCard
                :data-view-connection="dataViewConnectionsById.get(item.id)"
                :data-view-localised-config="item"
                :is-inert="isSplit && item.id === selectedDataViewId"
                :selected="item.id === selectedDataViewId"
                @category-click="handleFilterByCategory"
                @click="$emit('select', item)"
                @open="$emit('open', item)"
            />
        </template>

        <template #no-items>
            <EmptyPlaceholder
                :message-item-label="t(TEXT, 'dataView.other.text')"
                :description-item-label="t(TEXT, 'dataView.new.text')"
                :action-item-label="t(TEXT, 'dataView.label')"
                @add="$emit('add')"
            />
        </template>
    </Grid>
</template>
