<script setup lang="ts">
// Workbench core
import { t } from '@/locales';
import T from '@/locales/views/workflow/buildDataApps/BuildDataApps.json';

// Workbench components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Header from '@/components/block/header/Header.vue';

// Properties
type Properties = { isWideDisplay: boolean };
defineProps<Properties>();
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'workflow', label: 'Workflow Benchtop' }]" :title="t(T, 'title')" :is-wide-display="isWideDisplay" />

        <BenchtopScroller class="flex-1"></BenchtopScroller>
    </BenchtopShell>
</template>
