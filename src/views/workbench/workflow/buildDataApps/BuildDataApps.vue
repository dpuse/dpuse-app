<script setup lang="ts">
// App Core
import { t } from '@/locales';
import T from '@/locales/views/workbench/workflow/buildDataApps/BuildDataApps.json';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Header from '@/components/header/Header.vue';
import ViewScroller from '@/components/view/ViewScroller.vue';
import ViewShell from '@/components/view/ViewShell.vue';
</script>

<template>
    <ViewShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Build_Data_Apps')" :workbench-pane-is-hidden="false" />

        <ViewScroller></ViewScroller>
    </ViewShell>
</template>
