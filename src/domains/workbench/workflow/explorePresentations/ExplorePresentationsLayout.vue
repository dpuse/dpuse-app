<script setup lang="ts">
// External Dependencies
import cytoscape from 'cytoscape';
import { onMounted } from 'vue';

// Local (App) Framework
import { t } from '@/state/locale';
import T from './ExplorePresentationsLayout.json';

// Local Components - Static
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../../WorkbenchLayout.vue';

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars, sonarjs/no-dead-store -- We may need this.
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
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Explore_Presentations')" to="workflow" />

        <!-- <div class="relative flex min-h-0 flex-1 flex-col">
            <Separator class="mx-4" />
            <RouterView />
        </div> -->

        <Separator class="mx-4" />
        <div id="cy" class="flex-1"></div>
    </WorkbenchLayout>
</template>
