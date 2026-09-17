<script setup lang="ts">
// ── DPUse Framework
import type { Tool as D3Tool, ErdDiagramData } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { T } from './ContextEntityDiagramPanel_.json';
import { t } from '@/state/locale';

// ── Static Components
import ContextDiagramPanel from './_components/ContextDiagramPanel.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Sample data for proof of concept.
const ERD_DATA: ErdDiagramData = {
    nodes: [
        { id: 'organisation', label: 'Organisation', typeId: 'external' },
        { id: 'organisationalUnit', label: 'Organisational Unit', typeId: 'external' },
        { id: 'job', label: 'Job', typeId: 'optional' },
        { id: 'position', label: 'Position', typeId: 'local' },
        { id: 'person', label: 'Person', typeId: 'external' },
        { id: 'engagement', label: 'Engagement', typeId: 'local' },
        { id: 'contract', label: 'Contract', typeId: 'optional' },
        { id: 'occupancy', label: 'Occupancy', typeId: 'local' },
        { id: 'language', label: 'Language', typeId: 'external' },
        { id: 'nationality', label: 'Nationality', typeId: 'external' }
    ],
    edges: [
        { source: 'organisation', target: 'organisationalUnit' },
        { source: 'organisation', target: 'job' },
        { source: 'organisation', target: 'engagement' },
        { source: 'organisationalUnit', target: 'organisationalUnit' },
        { source: 'person', target: 'engagement' },
        { source: 'person', target: 'language' },
        { source: 'person', target: 'nationality' },
        { source: 'job', target: 'position' },
        { source: 'engagement', target: 'contract' },
        { source: 'contract', target: 'occupancy' },
        { source: 'position', target: 'occupancy' }
    ]
};

// Lays the rank out as organisation's children, then the shared 'engagement' node, then person's children. That way
// neither parent's edge into 'engagement' has to cross through the other parent's group.
const ORDER_CONSTRAINTS = [
    { left: 'organisation', right: 'person' },
    { left: 'organisationalUnit', right: 'job' },
    { left: 'job', right: 'engagement' },
    { left: 'engagement', right: 'language' },
    { left: 'language', right: 'nationality' },
    { left: 'position', right: 'occupancy' }
];

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function renderErdDiagram(d3Tool: D3Tool, element: HTMLElement): Promise<unknown> {
    return d3Tool.renderErdDiagram(ERD_DATA, element, { orderConstraints: ORDER_CONSTRAINTS });
}
</script>

<template>
    <ContextDiagramPanel :render="renderErdDiagram" :title="t(T, 'sampleErdDiagram.title')" />
</template>
