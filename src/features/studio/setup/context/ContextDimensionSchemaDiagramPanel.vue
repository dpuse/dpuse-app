<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, shallowRef, useTemplateRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import { loadTool } from '@dpuse/dpuse-shared/component/module/tool';
import type { Tool as D3Tool, TreeDiagramNode } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { toolConfigs } from '@/state/session';
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Static Components
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

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
            await d3Tool.renderTreeDiagram(DIMENSION_TREE, container.value);
        }
    } catch (error) {
        renderFailure.value = raiseFailure(
            new AppError('Failed to render diagram', 'dpuse.contextDimensionTreeDiagramPanel.renderDiagram', { typeId: 'handled' }, { cause: error })
        );
    }
}
</script>

<template>
    <DialogHeader class="flex-none" title="Sample Dimension Tree Diagram" />

    <ScrollArea class="min-h-0 flex-1">
        <ErrorNotice v-if="renderFailure" covers-region :failures="[renderFailure]" @retry="handleRetry" />

        <div v-show="!renderFailure" ref="container" class="p-6" />
    </ScrollArea>
</template>
