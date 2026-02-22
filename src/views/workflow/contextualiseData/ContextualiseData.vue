<script setup lang="ts">
// External dependencies
import { defineAsyncComponent } from 'vue';

// App core
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import { t } from '@/locales';
import T from '@/locales/views/workflow/contextualiseData/ContextualiseData.json';

// App components
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Card from '@/components/card/Card.vue';
import GridScroller from '@/components/gridScroller/GridScroller.vue';
import Header from '@/components/header/Header.vue';

// App components (lazy loaded)
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/emptyState/EmptyStatePlaceholder.vue'));

// Properties
type Properties = { activeBenchtopOptionConfig?: BenchtopOptionLocalisedConfig; isWideDisplay: boolean };
defineProps<Properties>();

// ??? ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const configs = [
    { id: '1', label: 'Event Query 1', badges: [{ id: '1', label: 'undefined' }] },
    { id: '2', label: 'Event Query 2', badges: [{ id: '1', label: 'danger', color: 'danger' }] },
    { id: '3', label: 'Event Query 3', badges: [{ id: '1', label: 'warning', color: 'warning' }] },
    { id: '4', label: 'Event Query 4', badges: [] },
    { id: '5', label: 'Event Query 5', badges: [] },
    { id: '6', label: 'Event Query 6', badges: [] },
    { id: '7', label: 'Event Query 7', badges: [] },
    { id: '8', label: 'Event Query 8', badges: [] },
    { id: '9', label: 'Event Query 9', badges: [] },
    { id: '10', label: 'Event Query 10', badges: [] }
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'Workflow_Benchtop') }]" :title="t(T, 'Contextualise_Data')" :is-wide-display="isWideDisplay" />

        <GridScroller v-if="configs.length > 0" class="flex-1" :items="configs" :row-height="150" :target-column-width="350">
            <template #default="{ item }">
                <Card
                    v-if="item"
                    :badges="item.badges"
                    :icon="activeBenchtopOptionConfig ? activeBenchtopOptionConfig.icon : undefined"
                    :icon-color="activeBenchtopOptionConfig ? activeBenchtopOptionConfig.color : undefined"
                    :label="item.label"
                />
            </template>
        </GridScroller>

        <BenchtopScroller v-else class="flex-1">
            <EmptyStatePlaceholder :message-item-label="t(T, 'event_queries')" :description-item-label="t(T, 'event_query')" :action-item-label="t(T, 'Event_Query')" />
        </BenchtopScroller>
    </BenchtopShell>
</template>
