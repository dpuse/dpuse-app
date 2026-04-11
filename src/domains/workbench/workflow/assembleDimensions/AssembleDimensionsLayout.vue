<script setup lang="ts">
// App Core
import { t } from '@/translations';
import T from '@/translations/domains/workbench/workflow/assembleDimensions/AssembleDimensionsLayout.json';

// App Components - Statically imported so always available, even after app goes offline.
import Header from '@/components/header/Header.vue';
import LayoutShell from '@/components/layoutShell/LayoutShell.vue';
</script>

<template>
    <LayoutShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Assemble_Dimensions')" :workbench-pane-is-hidden="false" />

        <RouterView />
    </LayoutShell>
</template>
