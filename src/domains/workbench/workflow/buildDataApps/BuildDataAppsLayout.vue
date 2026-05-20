<script setup lang="ts">
// External Dependencies
import ForceGraph from 'force-graph';
import { onMounted, useTemplateRef } from 'vue';

// Local (App) Framework
import { t } from '@/state/locale';
import T from './BuildDataAppsLayout.json';

// Local Components - Static
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';

// EXPERIMENTAL ────────────────────────────────────────────────────────────────────────────────────────────────────────

const container = useTemplateRef('container');

onMounted(() => {
    const N = 300;
    const gData = {
        nodes: [...Array.from({ length: N }).keys()].map((index) => ({ id: index })),
        links: [...Array.from({ length: N }).keys()].filter(Boolean).map((id) => ({
            source: id,
            // eslint-disable-next-line sonarjs/pseudo-random -- Not being used for a security-sensitive purpose.
            target: Math.round(Math.random() * (id - 1))
        }))
    };

    const Graph = new ForceGraph(container.value!).linkDirectionalParticles(2).graphData(gData);
});
</script>

<template>
    <LayoutShell>
        <Header class="mx-4" :overline="t(T, 'wb.label')" :title="t(T, 'Build_Data_Apps')" to="workflow" />

        <div ref="container" class="h-120 w-200"></div>

        <RouterView />
    </LayoutShell>
</template>
