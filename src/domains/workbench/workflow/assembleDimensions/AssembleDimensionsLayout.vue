<script setup lang="ts">
// External Dependencies
import Graph from 'graphology';
import Sigma from 'sigma';
import { onMounted, useTemplateRef } from 'vue';

// Local (App) Framework
import { t } from '@/state/locale';
import T from './AssembleDimensionsLayout.json';

// Local Components - Static
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';

// EXPERIMENTAL ────────────────────────────────────────────────────────────────────────────────────────────────────────

const container = useTemplateRef('container');

onMounted(() => {
    // Create a graph with graphology
    const graph = new Graph();

    // Add nodes with positions, sizes, colors, and labels
    graph.addNode('1', {
        label: 'Node 1',
        x: 0,
        y: 0,
        size: 20,
        color: 'blue'
    });
    graph.addNode('2', {
        label: 'Node 2',
        x: 5,
        y: 10,
        size: 20,
        color: 'red'
    });
    graph.addNode('3', {
        label: 'Node 3',
        x: 10,
        y: 0,
        size: 20,
        color: 'green'
    });

    // Add edges between nodes
    graph.addEdge('1', '2', { size: 10 });
    graph.addEdge('2', '3', { size: 10 });
    graph.addEdge('3', '1', { size: 10 });

    // Render the graph in the container
    const renderer = new Sigma(graph, container.value!);
});
</script>

<template>
    <LayoutShell>
        <Header class="mx-4" :overline="t(T, 'wb.label')" :title="t(T, 'Assemble_Dimensions')" to="workflow" />

        <div ref="container" class="h-120 w-200"></div>

        <RouterView />
    </LayoutShell>
</template>
