<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, ref, useTemplateRef } from 'vue';
import { RefreshCwIcon, TriangleAlertIcon } from '@lucide/vue';

// ── DPUse Framework
import { loadTool } from '@dpuse/dpuse-shared/component/module/tool';
import { AppError, type SerialisedError, serialiseError } from '@dpuse/dpuse-shared/errors';
import type { Tool as D3Tool, ErdDiagramData } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { reportAppError } from '@/observability/errorTracking';
import { toolConfigs } from '@/state/session';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';

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
const renderErrorChain = ref<SerialisedError[] | undefined>(undefined);

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
    renderErrorChain.value = undefined;
    try {
        const d3Tool = await loadTool<D3Tool>(toolConfigs.value, 'd3-visualiserr');
        if (container.value) {
            container.value.replaceChildren();
            await d3Tool.renderErdDiagram(ERD_DATA, container.value, { orderConstraints: ORDER_CONSTRAINTS });
        }
    } catch (error) {
        const appError = new AppError('Failed to render context ERD diagram.', 'dpuse.contextErdDiagramPanel.renderDiagram', { typeId: 'handled' }, { cause: error });
        renderErrorChain.value = serialiseError(appError);
        reportAppError(appError);
    }
}
</script>

<template>
    <ScrollArea class="min-h-0 flex-1">
        <div v-if="renderErrorChain" class="mx-auto mt-8 w-[calc(100%-2rem)] max-w-sm rounded-lg border border-warning-ring/20 bg-warning px-4 py-5 text-center">
            <TriangleAlertIcon class="mx-auto size-8 text-warning-text" stroke-width="1" />
            <p class="mt-2 text-sm font-semibold text-warning-text">{{ renderErrorChain[0]?.message }}</p>
            <p v-for="(causeError, index) in renderErrorChain.slice(1)" :key="index" class="mt-1 text-xs text-warning-text/70">
                {{ causeError.message }}
            </p>
            <Button class="mx-auto mt-3 flex items-center" variant="guarded" @click="handleRetry">
                <RefreshCwIcon class="mr-1.5 size-4" />
                Retry
            </Button>
        </div>

        <div v-show="!renderErrorChain" ref="container" class="p-6" />
    </ScrollArea>
</template>
