<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { EventQueryConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { defineLazyComponent } from '@/utilities/index.ts';
import { t } from '@/state/locale';
import { TEXT } from './EventQueryList_.json';
import { useCardRowHeight } from '@/components/ui/config/configCard';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import Grid from '@/components/ui/grid/Grid.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';

// ── Dynamic Components
const EmptyPlaceholder = defineLazyComponent(() => import('@/components/ui/placeholder/EmptyPlaceholder.vue'), 'EmptyPlaceholder');

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { eventQueryLocalisedConfigs, isSplit, retrievalIsSettled, retrievalIsSlow, selectedEventQueryId } = defineProps<{
    eventQueryLocalisedConfigs: LocalisedConfig<EventQueryConfig>[];
    isSplit: boolean; // The detail is showing beside the list, so the selected card's detail is already on screen.
    retrievalIsSettled: boolean; // The event queries have been retrieved, or retrieving them has failed. Until then the list stays busy.
    retrievalIsSlow: boolean; // Retrieving is taking a while, so the list says so and offers a way out.
    selectedEventQueryId: string | undefined;
}>();
defineEmits<{
    add: [];
    cancelRetrieval: [];
    retryRetrieval: [];
    select: [eventQueryLocalisedConfig: LocalisedConfig<EventQueryConfig>];
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Grid ─ 'rowCount' stays undefined, which keeps the grid busy, until retrieval settles either way; 0 means
// confirmed empty.
const eventQueryDataSource = computed((): DataSource<LocalisedConfig<EventQueryConfig>> => ({
    rowCount: retrievalIsSettled ? eventQueryLocalisedConfigs.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<EventQueryConfig>[] }> => Promise.resolve({ rows: eventQueryLocalisedConfigs.slice(start, end) })
}));

// Cards here have no actions or details yet, so they are one row high.
const cardRowHeight = useCardRowHeight(false);

// The selected card is scrolled into view, so a selection restored when the list opens can be seen. Built from the id,
// so a new object for the same event query, as a change of language gives, does not scroll the list again.
const matchSelectedRow = computed(() => {
    const id = selectedEventQueryId;
    return id === undefined ? undefined : (item: LocalisedConfig<EventQueryConfig>): boolean => item.id === id;
});
</script>

<template>
    <Grid
        :add-label="t(TEXT, 'eventQuery.label')"
        class="flex-1"
        data-region="EventQueryList"
        :data-source="eventQueryDataSource"
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
            <ConfigCard
                :config="item"
                hides-icon
                :is-inert="isSplit && item.id === selectedEventQueryId"
                :selected="item.id === selectedEventQueryId"
                @click="$emit('select', item)"
            />
        </template>

        <template #no-items>
            <EmptyPlaceholder
                :message-item-label="t(TEXT, 'eventQuery.other.text')"
                :description-item-label="t(TEXT, 'eventQuery.new.text')"
                :action-item-label="t(TEXT, 'eventQuery.label')"
                @add="$emit('add')"
            />
        </template>
    </Grid>
</template>
