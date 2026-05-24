<script setup lang="ts">
// Local (App) Framework
import { t } from '@/state/locale';
import T from './ExplorePresentationsLayout.json';

// Local Components - Static
import Header from '@/components/framework/header/Header.vue';
import LayoutShell from '~/src/components/ui/layoutShell/LayoutShell.vue';

import cytoscape from 'cytoscape';
import { onMounted } from 'vue';

onMounted(() => {
    const cy = cytoscape({
        container: document.querySelector('#cy'), // container to render in
        elements: [
            // list of graph elements to start with
            { data: { id: 'a' } /* node a */ },
            { data: { id: 'b' } /* node b */ },
            { data: { id: 'ab', source: 'a', target: 'b' } /* edge ab */ }
        ],
        style: [
            // the stylesheet for the graph
            { selector: 'node', style: { 'background-color': '#666', label: 'data(id)' } },
            { selector: 'edge', style: { width: 3, 'line-color': '#ccc', 'target-arrow-color': '#ccc', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier' } }
        ],
        layout: { name: 'grid', rows: 1 }
    });
});
</script>

<template>
    <LayoutShell>
        <Header class="mx-4" :overline="t(T, 'wb.label')" :title="t(T, 'Explore_Presentations')" to="workflow" />

        <div id="cy" class="h-75 w-75"></div>

        <!-- <RouterView /> -->
    </LayoutShell>
</template>
