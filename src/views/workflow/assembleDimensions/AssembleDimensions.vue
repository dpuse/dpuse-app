<script setup lang="ts">
// External dependencies
import { defineAsyncComponent } from 'vue';

// Workbench core
import { t } from '@/locales';
import T from '@/locales/views/workflow/assembleDimensions/AssembleDimensions.json';

// Workbench components
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';

// Workbench components (lazy loaded)
const EmptyStatePlaceholder = defineAsyncComponent(() => import('@/components/emptyState/EmptyStatePlaceholder.vue'));

// Properties
type Properties = { isWideDisplay: boolean };
defineProps<Properties>();
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'overline') }]" :title="t(T, 'title')" :is-wide-display="isWideDisplay" />

        <BenchtopScroller class="flex-1">
            <EmptyStatePlaceholder message-item-label="dimensions" description-item-label="dimension" action-item-label="Dimension" />
        </BenchtopScroller>
    </BenchtopShell>
</template>
