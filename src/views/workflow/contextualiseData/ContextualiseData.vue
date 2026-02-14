<script setup lang="ts">
// External dependencies
import { defineAsyncComponent } from 'vue';

// Workbench components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Header from '@/components/block/header/Header.vue';

// Properties
const properties = defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isWideDisplay: boolean }>();

// Workbench components (lazy loaded)
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/block/emptyState/EmptyStatePlaceholder.vue'));
</script>

<template>
    <BenchtopShell :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-wide-display="properties.isWideDisplay">
        <Header
            :breadcrumbs="[{ id: 'workflow', label: 'Workflow Benchtop' }]"
            title="Contextualise Data"
            :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay"
            :is-wide-display="properties.isWideDisplay"
        />

        <BenchtopScroller class="flex-1">
            <EmptyStatePlaceholder message-item-label="event queries" description-item-label="event query" action-item-label="Event Queries" />
        </BenchtopScroller>
    </BenchtopShell>
</template>
