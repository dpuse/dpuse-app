<script setup lang="ts">
// App Core
import { t } from '@/locales';
import T from '@/locales/views/workflow/explorePresentations/ExplorePresentations.json';

// App Components - Statically imported so always available, even when offline.
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'Workflow_Benchtop') }]" :title="t(T, 'Explore_Presentations')" :workbench-pane-is-hidden="false" />

        <BenchtopScroller class="flex-1"></BenchtopScroller>
    </BenchtopShell>
</template>
