<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, ref, shallowRef, useTemplateRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import { loadTool } from '@dpuse/dpuse-shared/component/module/tool';
import type { Tool as D3Tool, TreeDiagramNode } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { reportAppError } from '@/observability/errorTracking';
import { toolConfigs } from '@/state/session';

// ── Static Components
import ErrorDisplay from '@/components/ui/error/ErrorDisplay.vue';
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
const renderError = shallowRef<AppError | undefined>();
// Undefined until the error report completes, so ErrorDisplay can distinguish reporting-pending from failed.
const errorWasReported = ref<boolean | undefined>();

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
    renderError.value = undefined;
    errorWasReported.value = undefined;
    try {
        const d3Tool = await loadTool<D3Tool>(toolConfigs.value, 'd3-visualiser');
        if (container.value) {
            await d3Tool.renderTreeDiagram(DIMENSION_TREE, container.value);
        }
    } catch (error) {
        renderError.value = new AppError('Failed to render diagram', 'dpuse.contextDimensionTreeDiagramPanel.renderDiagram', { typeId: 'handled' }, { cause: error });
        errorWasReported.value = await reportAppError(renderError.value);
    }
}
</script>

<template>
    <ScrollArea class="min-h-0 flex-1">
        <ErrorDisplay v-if="renderError" :error="renderError" :error-was-reported="errorWasReported" @retry="handleRetry" />

        <div v-show="!renderError" ref="container" class="p-6" />
    </ScrollArea>
</template>
