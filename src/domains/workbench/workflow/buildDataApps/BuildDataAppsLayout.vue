<script setup lang="ts">
// Local Framework
import { t } from '@/translations';
import T from '@/translations/domains/workbench/workflow/buildDataApps/BuildDataAppsLayout.json';

// Local Components - Static
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';
</script>

<template>
    <LayoutShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Build_Data_Apps')" />

        <RouterView />
    </LayoutShell>
</template>
