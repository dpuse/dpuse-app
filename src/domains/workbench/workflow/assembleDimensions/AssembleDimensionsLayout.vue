<script setup lang="ts">
// External Dependencies
import ForceSupervisor from 'graphology-layout-force/worker';
import Graph from 'graphology';
import { NodeImageProgram } from '@sigma/node-image';
import Sigma from 'sigma';
import { onMounted, onUnmounted, useTemplateRef } from 'vue';

// Local (App) Framework
import { t } from '@/state/locale';
import T from './AssembleDimensionsLayout.json';

// Local Components - Static
import Header from '@/components/composite/header/Header.vue';
import LayoutShell from '@/components/elementary/layoutShell/LayoutShell.vue';
import NodeGradientProgram from './node-gradient.ts';

// EXPERIMENTAL ────────────────────────────────────────────────────────────────────────────────────────────────────────

const container = useTemplateRef('container');
let renderer: Sigma | null = null;
let layout: ForceSupervisor | null = null;

onMounted(() => {
    if (container.value == null) return;

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

    // const STRING_SVG_ICON = `<svg
    //   fill="#ffffff"
    //   stroke-width="0"
    //   viewBox="0 0 320 512"
    //   height="200px"
    //   width="200px"
    //   xmlns="http://www.w3.org/2000/svg"
    // >
    //   <path
    //     d="M142.9 96c-21.5 0-42.2 8.5-57.4 23.8L54.6 150.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L40.2 74.5C67.5 47.3 104.4 32 142.9 32C223 32 288 97 288 177.1c0 38.5-15.3 75.4-42.5 102.6L109.3 416H288c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-12.9 0-24.6-7.8-29.6-19.8s-2.2-25.7 6.9-34.9L200.2 234.5c15.2-15.2 23.8-35.9 23.8-57.4c0-44.8-36.3-81.1-81.1-81.1z"
    //   ></path>
    // </svg>`;

    // TODO: Requires 'blob:' to img csp in '_header' and 'vite.config.ts'.
    const USER_STRING = `
      <svg xmlns="http://www.w3.org/2000/svg" height="64" width="64" viewBox="0 0 64 64" role="img" aria-label="user icon">
        <circle cx="32" cy="24" r="14" fill="#ffffff"/>
        <path d="M10 58c2-12 11-20 22-20s20 8 22 20" fill="#ffffff"/>
      </svg>`;

    graph.addNode('John', { size: 15, label: 'John', type: 'image', image: svgToDataURI(USER_STRING), color: RED });
    graph.addNode('Mary', { size: 15, label: 'Mary', type: 'image', image: '/user.svg', color: RED });
    graph.addNode('Susan', { size: 15, label: 'Susan', type: 'image', image: '/user.svg', color: RED });
    graph.addNode('Nantes', { size: 15, label: 'Nantes', type: 'image', image: '/city.svg', color: BLUE });
    graph.addNode('New-York', { size: 15, label: 'New-York', type: 'image', image: '/city.svg', color: BLUE });
    graph.addNode('Sushi', { size: 7, label: 'Sushi', type: 'gradient', color: GREEN });
    graph.addNode('Falafel', { size: 7, label: 'Falafel', type: 'gradient', color: GREEN });
    graph.addNode('Kouign Amann', { size: 7, label: 'Kouign Amann', type: 'gradient', color: GREEN });

    graph.addEdge('John', 'Mary', { type: 'line', label: 'works with', size: 5 });
    graph.addEdge('Mary', 'Susan', { type: 'line', label: 'works with', size: 5 });
    graph.addEdge('Mary', 'Nantes', { type: 'arrow', label: 'lives in', size: 5 });
    graph.addEdge('John', 'New-York', { type: 'arrow', label: 'lives in', size: 5 });
    graph.addEdge('Susan', 'New-York', { type: 'arrow', label: 'lives in', size: 5 });
    graph.addEdge('John', 'Falafel', { type: 'arrow', label: 'eats', size: 5 });
    graph.addEdge('Mary', 'Sushi', { type: 'arrow', label: 'eats', size: 5 });
    graph.addEdge('Susan', 'Kouign Amann', { type: 'arrow', label: 'eats', size: 5 });

    for (const [index, node] of graph.nodes().entries()) {
        const angle = (index * 2 * Math.PI) / graph.order;
        graph.setNodeAttribute(node, 'x', 100 * Math.cos(angle));
        graph.setNodeAttribute(node, 'y', 100 * Math.sin(angle));
    }

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

function svgToDataURI(svg: string): string {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
}
</script>

<template>
    <LayoutShell>
        <Header class="mx-4" :overline="t(T, 'wb.label')" :title="t(T, 'Assemble_Dimensions')" to="workflow" />

        <!-- <RouterView /> -->
        <div ref="container" class="h-120 w-200"></div>
    </LayoutShell>
</template>
