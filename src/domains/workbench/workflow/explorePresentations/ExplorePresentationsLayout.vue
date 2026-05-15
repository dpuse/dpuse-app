<script setup lang="ts">
// Local (App) Framework
import { t } from '@/state/locale';
import T from './ExplorePresentationsLayout.json';

// Local Components - Static
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';

import { onMounted, useTemplateRef } from 'vue';
import { createEditor } from './editor';
const container = useTemplateRef('container');

onMounted(() => {
    createEditor(container.value!);
});
</script>

<template>
    <LayoutShell>
        <Header class="mx-4" :overline="t(T, 'wb.label')" :title="t(T, 'Explore_Presentations')" to="workflow" />

        <div class="h-120 w-200" ref="container"></div>

        <RouterView />
    </LayoutShell>
</template>
