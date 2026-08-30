<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, shallowRef, useTemplateRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import { loadTool } from '@dpuse/dpuse-shared/component/module/tool';
import type { Tool as D3Tool, ErdDiagramData } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { type AppFailure, raiseFailure } from '@/state/errors';
import { toolConfigs } from '@/state/session';

// ── Static Components
import ErrorDisplay from '@/components/ui/error/ErrorDisplay.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

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
const renderFailure = shallowRef<AppFailure | undefined>();

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    void renderDiagram();
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetry(): void {
    void renderDiagram();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function renderDiagram(): Promise<void> {
    renderFailure.value = undefined;
    try {
        const d3Tool = await loadTool<D3Tool>(toolConfigs.value, 'd3-visualiser');
        if (container.value) {
            await d3Tool.renderErdDiagram(ERD_DATA, container.value, { orderConstraints: ORDER_CONSTRAINTS });
        }
    } catch (error) {
        renderFailure.value = raiseFailure(new AppError('Failed to render diagram', 'dpuse.contextErdDiagramPanel.renderDiagram', { typeId: 'handled' }, { cause: error }));
    }
}
</script>

<template>
    <ScrollArea class="min-h-0 flex-1">
        <ErrorDisplay v-if="renderFailure" covers-region :failures="[renderFailure]" @retry="handleRetry" />

        <div v-show="!renderFailure" ref="container" class="p-6" />
    </ScrollArea>
</template>
