<script setup lang="ts">
// External dependencies
import { defineAsyncComponent } from 'vue';

// Workbench core
import { t } from '@/locales';
import T from '@/locales/views/workflow/establishDataViews/EstablishDataViews.json';

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
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'overline') }]" :title="t(T, 'title')" :is-wide-display="isWideDisplay" />

        <BenchtopScroller class="flex-1">
            <EmptyStatePlaceholder message-item-label="data views" description-item-label="data view" action-item-label="Data View" />
        </BenchtopScroller>
    </BenchtopShell>
</template>
