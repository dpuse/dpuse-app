<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, shallowRef, useTemplateRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import { loadTool } from '@dpuse/dpuse-shared/component/module/tool';
import type { Tool as D3Tool, ErdDiagramData } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { T } from './ContextEntityDiagramPanel_.json';
import { t } from '@/state/locale';
import { toolConfigs } from '@/state/session';
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Static Components
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

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

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const d3ContainerElement = useTemplateRef<HTMLDivElement>('d3Container');
const d3RenderFailure = shallowRef<AppFailure | undefined>();

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
    d3RenderFailure.value = undefined;
    try {
        const d3Tool = await loadTool<D3Tool>(toolConfigs.value, 'd3-visualiser');
        if (d3ContainerElement.value) {
            await d3Tool.renderErdDiagram(ERD_DATA, d3ContainerElement.value, { orderConstraints: ORDER_CONSTRAINTS });
        }
    } catch (error) {
        d3RenderFailure.value = raiseFailure(new AppError('Failed to render diagram', 'dpuse.ContextEntityDiagramPanel.renderDiagram', { typeId: 'handled' }, { cause: error }));
    }
}
</script>

<template>
    <DialogHeader class="flex-none" :title="t(T, 'sampleErdDiagram.title')" />

    <ScrollArea class="min-h-0 flex-1">
        <ErrorNotice v-if="d3RenderFailure" covers-region :failures="[d3RenderFailure]" @retry="handleRetry" />

        <!-- v-show, not v-if: keeps this in the DOM so D3 always has an element to draw into, even while hidden. -->
        <div v-show="!d3RenderFailure" ref="d3Container" class="p-6" />
    </ScrollArea>
</template>
