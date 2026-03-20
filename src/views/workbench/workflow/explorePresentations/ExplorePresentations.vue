<script setup lang="ts">
// App Core
import { t } from '@/locales';
import T from '@/locales/views/workflow/explorePresentations/ExplorePresentations.json';

// App Components & Views - Statically imported so always available, even after app goes offline.
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Explore_Presentations')" :workbench-pane-is-hidden="false" />

        <BenchtopScroller></BenchtopScroller>
    </BenchtopShell>
</template>
