<script setup lang="ts">
// Local (App) Framework
import { t } from '@/state/locale';
import T from './BuildDataAppsLayout.json';

// Local Components - Static
import Header from '@/components/framework/Header.vue';
import LayoutShell from '@/components/ui/LayoutShell.vue';
</script>

<template>
    <LayoutShell>
        <Header class="mx-4" :overline="t(T, 'wb.label')" :title="t(T, 'Build_Data_Apps')" to="workflow" />

        <RouterView />
    </LayoutShell>
</template>
