<script setup lang="ts">
// App Core
import { t } from '@/locales';
import T from '@/locales/views/workflow/assembleDimensions/AssembleDimensions.json';

// App Components & Views - Statically imported so always available, even after app goes offline.
import ViewShell from '@/components/view/ViewShell.vue';
import Header from '@/components/header/Header.vue';
</script>

<template>
    <ViewShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Assemble_Dimensions')" :workbench-pane-is-hidden="false" />

        <RouterView />
    </ViewShell>
</template>
