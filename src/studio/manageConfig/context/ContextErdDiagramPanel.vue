<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, useTemplateRef } from 'vue';

// ── DPUse Framework
import type { D3Tool as D3ToolType, ErdDiagramData } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { toolConfigs } from '@/state/session';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Evaluation example: hard-coded ERD, laid out and drawn by dpuse-tool-d3-visualiser's renderErdDiagram (dagre + d3-selection).
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

// Order constraints lay the rank out as: [organisation's own children] [engagement, shared] [person's own children],
// so neither parent's edge into 'engagement' has to cross back through the other parent's cluster.
const ORDER_CONSTRAINTS = [
    { left: 'organisation', right: 'person' },
    { left: 'organisationalUnit', right: 'job' },
    { left: 'job', right: 'engagement' },
    { left: 'engagement', right: 'language' },
    { left: 'language', right: 'nationality' },
    { left: 'position', right: 'occupancy' }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const container = useTemplateRef<HTMLDivElement>('container');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(async () => {
    const d3Tool = await loadD3Tool();
    if (container.value) await d3Tool.renderErdDiagram(ERD_DATA, container.value, { orderConstraints: ORDER_CONSTRAINTS });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadD3Tool(): Promise<D3ToolType> {
    const toolModuleConfig = toolConfigs.value.find((config) => config.id === 'dpuse-tool-d3-visualiser');
    if (!toolModuleConfig) throw new Error('No D3 tool module configuration.');

    const url = `https://engine-eu.dpuse.app/tools/d3-visualiser_v${toolModuleConfig.version}/dpuse-tool-d3-visualiser.es.js`;
    const module = (await import(/* @vite-ignore */ url)) as { D3Tool: new () => D3ToolType };
    const D3Tool = module.D3Tool;
    return new D3Tool();
}
</script>

<template>
    <div ref="container" class="min-h-0 flex-1 overflow-auto p-6" />
</template>
