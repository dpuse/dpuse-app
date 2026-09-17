<script setup lang="ts">
// ── DPUse Framework
import type { Tool as D3Tool, TreeDiagramNode } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './ContextDimensionDiagramPanel_.json';

// ── Static Components
import ContextDiagramPanel from './_components/ContextDiagramPanel.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Sample data for proof of concept.
const DIMENSION_TREE: TreeDiagramNode = {
    id: 'geography',
    label: 'Geography',
    children: [
        {
            id: 'europe',
            label: 'Europe',
            children: [
                { id: 'unitedKingdom', label: 'United Kingdom' },
                { id: 'germany', label: 'Germany' }
            ]
        },
        {
            id: 'northAmerica',
            label: 'North America',
            children: [
                { id: 'unitedStates', label: 'United States' },
                { id: 'canada', label: 'Canada' }
            ]
        }
    ]
};

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function renderTreeDiagram(d3Tool: D3Tool, element: HTMLElement): Promise<unknown> {
    return d3Tool.renderTreeDiagram(DIMENSION_TREE, element);
}
</script>

<template>
    <ContextDiagramPanel :render="renderTreeDiagram" :title="t(TEXT, 'sampleDimensionTreeDiagram.title')" />
</template>
