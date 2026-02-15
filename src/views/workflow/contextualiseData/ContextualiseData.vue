<script setup lang="ts">
// External dependencies
import { defineAsyncComponent } from 'vue';

// Workbench core
import { t } from '@/locales';
import T from '@/locales/views/workflow/contextualiseData/ContextualiseData.json';

// Workbench components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Card from '@/components/base/Card.vue';
import GridScroller from '@/components/block/gridScroller/GridScroller.vue';
import Header from '@/components/block/header/Header.vue';

// Properties
const properties = defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isWideDisplay: boolean }>();

// Workbench components (lazy loaded)
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/block/emptyState/EmptyStatePlaceholder.vue'));

const configs = [
    { id: '1', label: 'Event Query 1' },
    { id: '2', label: 'Event Query 2' },
    { id: '3', label: 'Event Query 3' },
    { id: '4', label: 'Event Query 4' },
    { id: '5', label: 'Event Query 5' },
    { id: '6', label: 'Event Query 6' },
    { id: '7', label: 'Event Query 7' },
    { id: '8', label: 'Event Query 8' },
    { id: '9', label: 'Event Query 9' },
    { id: '10', label: 'Event Query 10' }
];
</script>

<template>
    <BenchtopShell :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-wide-display="properties.isWideDisplay">
        <Header
            :breadcrumbs="[{ id: 'workflow', label: 'Workflow Benchtop' }]"
            :title="t(T, 'contextualiseData')"
            :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay"
            :is-wide-display="properties.isWideDisplay"
        />

        <GridScroller v-if="configs.length > 0" class="flex-1" :items="configs" :row-height="150" :target-column-width="250">
            <template #default="{ item }">
                <Card v-if="item" :label="item.label" />
            </template>
        </GridScroller>

        <BenchtopScroller v-else class="flex-1">
            <EmptyStatePlaceholder message-item-label="event queries" description-item-label="event query" action-item-label="Event Queries" />
        </BenchtopScroller>
    </BenchtopShell>
</template>
