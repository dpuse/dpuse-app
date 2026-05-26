<script setup lang="ts">
// Local (App) Framework
import { t } from '@/state/locale';
import T from './BuildDataAppsLayout.json';

// Local Components - Static
import LayoutShell from '@/components/ui/LayoutShell.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
</script>

<template>
    <LayoutShell>
        <WorkbenchHeader class="mx-4" :overline="t(T, 'wb.label')" :title="t(T, 'Build_Data_Apps')" to="workflow" />

        <RouterView />
    </LayoutShell>
</template>
