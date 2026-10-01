<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue';

// ── DPUse Framework
import { AppError, loadTool } from '@dpuse/dpuse-shared';
import type { D3NetworkView, Tool as D3Tool, NetworkDiagramData } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { t } from '@/state/locale';
import { toolConfigs } from '@/state/session';
import { useConfigsReady } from '@/services/useConfigsReady';
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Static Components
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'autoLayout.label': { en: 'Auto-layout', es: 'Diseño automático' },
    'contextualiseData.title': { en: 'Contextualise Data', es: 'Contextualizar Datos' },
    'eventQuery.label': { en: 'Event Query', es: 'Consulta de Eventos' },
    'eventQuery.other.text': { en: 'event queries', es: 'consultas de eventos' },
    'workflow.label': { en: 'Workflow', es: 'Flujo de Trabajo' }
};

// ── Data ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

const data: NetworkDiagramData = {
    links: [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'C' },
        { source: 'D', target: 'C' },
        { source: 'E', target: 'D' },
        { source: 'F', target: 'D' },
        { source: 'G', target: 'D' },
        { source: 'H', target: 'F' },
        { source: 'I', target: 'F' },
        { source: 'J', target: 'F' }
    ],
    nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }, { id: 'F' }, { id: 'G' }, { id: 'H' }, { id: 'I' }, { id: 'J' }]
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const container = useTemplateRef<HTMLDivElement>('container');
const renderFailure = shallowRef<AppFailure | undefined>();
const route = useRoute();
const state: { view: D3NetworkView | null } = { view: null };

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    void renderDiagram();
});

onBeforeUnmount(() => {
    state.view?.destroy();
    state.view = null;
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleAutoLayout(): void {
    state.view?.triggerAutoLayout();
}

function handleRetry(): void {
    void renderDiagram();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function renderDiagram(): Promise<void> {
    renderFailure.value = undefined;
    try {
        await useConfigsReady();
        const d3Tool = await loadTool<D3Tool>(toolConfigs.value, 'd3-visualiser');

        state.view?.destroy(); // Discard any earlier view so a retry replaces it rather than rendering a second one.
        state.view = null;
        if (container.value) state.view = await d3Tool.renderNetworkDiagram(data, container.value);
    } catch (error) {
        renderFailure.value = raiseFailure(
            new AppError('Failed to render network diagram.', 'dpuse-app.EventQueriesLayout.renderDiagram', { typeId: 'handled' }, { cause: error })
        );
    }
}
</script>

<template>
    <StudioLayout>
        <StudioHeader class="flex-none px-4" overline="Studio" :title="t(TEXT, 'contextualiseData.title')" :to="{ name: 'studio', query: route.query }" />

        <Separator />

        <ErrorNotice v-if="renderFailure" covers-region :failures="[renderFailure]" @retry="handleRetry" />

        <div v-show="!renderFailure" class="px-4 py-2">
            <RectangleButton variant="outline" @click="handleAutoLayout">{{ t(TEXT, 'autoLayout.label') }}</RectangleButton>
        </div>

        <div v-show="!renderFailure" ref="container" class="w-full flex-1" />
    </StudioLayout>
</template>
