<script setup lang="ts">
// Workbench core
import { t } from '@/locales';
import T from '@/locales/views/workflow/explorePresentations/ExplorePresentations.json';

// Workbench components
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';

// Properties
type Properties = { isWideDisplay: boolean };
defineProps<Properties>();
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'overline') }]" :title="t(T, 'title')" :is-wide-display="isWideDisplay" />

        <BenchtopScroller class="flex-1"></BenchtopScroller>
    </BenchtopShell>
</template>
