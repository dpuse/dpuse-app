<script setup lang="ts">
// App Framework
import { t } from '@/translations';
import T from '@/translations/domains/workbench/workflow/buildDataApps/BuildDataAppsLayout.json';

// App Static Components
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';
</script>

<template>
    <LayoutShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Build_Data_Apps')" />

        <RouterView />
    </LayoutShell>
</template>
