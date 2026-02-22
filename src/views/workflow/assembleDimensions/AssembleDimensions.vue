<script setup lang="ts">
// External dependencies
import { defineAsyncComponent } from 'vue';

// App core
import { t } from '@/locales';
import T from '@/locales/views/workflow/assembleDimensions/AssembleDimensions.json';

// App components
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';

// App components (lazy loaded)
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/emptyState/EmptyStatePlaceholder.vue'));

// Properties
type Properties = { isWideDisplay: boolean };
defineProps<Properties>();
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'Workflow_Benchtop') }]" :title="t(T, 'Assemble_Dimensions')" :is-wide-display="isWideDisplay" />

        <BenchtopScroller class="flex-1">
            <EmptyStatePlaceholder :message-item-label="t(T, 'dimensions')" :description-item-label="t(T, 'dimension')" :action-item-label="t(T, 'Dimension')" />
        </BenchtopScroller>
    </BenchtopShell>
</template>
