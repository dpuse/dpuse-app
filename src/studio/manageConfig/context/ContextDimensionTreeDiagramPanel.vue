<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, useTemplateRef } from 'vue';

// ── DPUse Framework
import type { D3Tool as D3ToolType, TreeDiagramNode } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { toolConfigs } from '@/state/session';

// ── Local Components - Static
import ScrollArea from '@/components/ui/ScrollArea2.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Evaluation example: strict tree (single parent per node), laid out and drawn by dpuse-tool-d3-visualiser's renderTreeDiagram (d3-hierarchy + d3-selection).
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

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const container = useTemplateRef<HTMLDivElement>('container');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(async () => {
    const d3Tool = await loadD3Tool();
    if (container.value) await d3Tool.renderTreeDiagram(DIMENSION_TREE, container.value);
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
    <ScrollArea class="min-h-0 flex-1">
        <div ref="container" class="p-6" />
    </ScrollArea>
</template>
