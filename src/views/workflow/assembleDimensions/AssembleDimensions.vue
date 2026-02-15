<script setup lang="ts">
// External dependencies
import { defineAsyncComponent } from 'vue';

// Workbench components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Header from '@/components/block/header/Header.vue';

// Workbench components (lazy loaded)
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/block/emptyState/EmptyStatePlaceholder.vue'));

// Properties
type Properties = { isWideDisplay: boolean };
defineProps<Properties>();
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'workflow', label: 'Workflow Benchtop' }]" title="Assemble Dimensions" :is-wide-display="isWideDisplay" />

        <BenchtopScroller class="flex-1">
            <EmptyStatePlaceholder message-item-label="dimensions" description-item-label="dimension" action-item-label="Dimension" />
        </BenchtopScroller>
    </BenchtopShell>
</template>
