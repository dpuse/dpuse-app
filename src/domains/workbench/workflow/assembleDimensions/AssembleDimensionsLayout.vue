<script setup lang="ts">
// External Dependencies
import { NodeImageProgram } from '@sigma/node-image';
import Graph from 'graphology';
import ForceSupervisor from 'graphology-layout-force/worker';
import Sigma from 'sigma';
import { onMounted, onUnmounted, useTemplateRef } from 'vue';

// Local (App) Framework
import { t } from '@/state/locale';
import T from './AssembleDimensionsLayout.json';

// Local Components - Static
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';
import NodeGradientProgram from './node-gradient.ts';

// EXPERIMENTAL ────────────────────────────────────────────────────────────────────────────────────────────────────────

const container = useTemplateRef('container');
let renderer: Sigma | null = null;
let layout: ForceSupervisor | null = null;

onMounted(() => {
    if (!container.value) return;

    /**
     * This example shows how to use different programs to render nodes.
     * This works in two steps:
     * 1. You must declare all the different rendering programs to sigma when you
     *    instantiate it
     * 2. You must give to each node and edge a "type" value that matches a declared
     *    program
     * The programs offered by default by sigma are in src/rendering/webgl/programs,
     * but you can add your own.
     *
     * Here in this example, some nodes are drawn with images in them using the
     * createNodeImageProgram provided by @sigma/node-image. Some others are drawn
     * as white disc with a border, and the custom program to draw them is in this
     * directory.
     */
    const graph = new Graph();

    const RED = '#FA4F40';
    const BLUE = '#727EE0';
    const GREEN = '#5DB346';

    graph.addNode('John', { size: 15, label: 'John', type: 'image', image: 'https://www.dpuse.app/user.svg', color: RED });
    graph.addNode('Mary', { size: 15, label: 'Mary', type: 'image', image: '/user.svg', color: RED });
    graph.addNode('Suzan', { size: 15, label: 'Suzan', type: 'image', image: '/user.svg', color: RED });
    graph.addNode('Nantes', { size: 15, label: 'Nantes', type: 'image', image: '/city.svg', color: BLUE });
    graph.addNode('New-York', { size: 15, label: 'New-York', type: 'image', image: '/city.svg', color: BLUE });
    graph.addNode('Sushis', { size: 7, label: 'Sushis', type: 'gradient', color: GREEN });
    graph.addNode('Falafels', { size: 7, label: 'Falafels', type: 'gradient', color: GREEN });
    graph.addNode('Kouign Amann', { size: 7, label: 'Kouign Amann', type: 'gradient', color: GREEN });

    graph.addEdge('John', 'Mary', { type: 'line', label: 'works with', size: 5 });
    graph.addEdge('Mary', 'Suzan', { type: 'line', label: 'works with', size: 5 });
    graph.addEdge('Mary', 'Nantes', { type: 'arrow', label: 'lives in', size: 5 });
    graph.addEdge('John', 'New-York', { type: 'arrow', label: 'lives in', size: 5 });
    graph.addEdge('Suzan', 'New-York', { type: 'arrow', label: 'lives in', size: 5 });
    graph.addEdge('John', 'Falafels', { type: 'arrow', label: 'eats', size: 5 });
    graph.addEdge('Mary', 'Sushis', { type: 'arrow', label: 'eats', size: 5 });
    graph.addEdge('Suzan', 'Kouign Amann', { type: 'arrow', label: 'eats', size: 5 });

    graph.nodes().forEach((node, i) => {
        const angle = (i * 2 * Math.PI) / graph.order;
        graph.setNodeAttribute(node, 'x', 100 * Math.cos(angle));
        graph.setNodeAttribute(node, 'y', 100 * Math.sin(angle));
    });

    renderer = new Sigma(graph, container.value, {
        nodeProgramClasses: {
            image: NodeImageProgram,
            gradient: NodeGradientProgram
        },
        renderEdgeLabels: true
    });

    layout = new ForceSupervisor(graph);
    layout.start();
});

onUnmounted(() => {
    layout?.kill();
    layout = null;
    renderer?.kill();
    renderer = null;
});
</script>

<template>
    <LayoutShell>
        <Header class="mx-4" :overline="t(T, 'wb.label')" :title="t(T, 'Assemble_Dimensions')" to="workflow" />

        <!-- <RouterView /> -->
        <div ref="container" class="h-120 w-200"></div>
    </LayoutShell>
</template>
