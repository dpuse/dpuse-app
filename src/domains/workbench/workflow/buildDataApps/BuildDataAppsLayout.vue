<script setup lang="ts">
// Local (App) Framework
import { t } from '@/state/locale';
import T from './BuildDataAppsLayout.json';

// Local (App) Framework
import { type BreadcrumbConfig, useBreadcrumbs } from '@/composables/useBreadcrumbs';

// Local Components - Static
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { breadcrumbs } = useBreadcrumbs<BreadcrumbConfig>([{ id: 'benchtop', label: t(T, 'wb.label') }]);
</script>

<template>
    <LayoutShell>
        <Header :breadcrumbs="breadcrumbs" :title="t(T, 'Build_Data_Apps')" />

        <RouterView />
    </LayoutShell>
</template>
