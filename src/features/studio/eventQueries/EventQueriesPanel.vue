<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { D3NetworkView, Tool as D3Tool, NetworkDiagramData } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { establishTool } from '@/services/tools';
import { t } from '@/state/locale';
import { TEXT } from './EventQueriesPanel_.json';
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Static Components
import BusyBar from '@/components/ui/BusyBar.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';

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
const diagramIsPending = ref(true); // The diagram area is blank while the d3 tool downloads and draws, so the wait is shown.
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
    diagramIsPending.value = true;
    try {
        const d3Tool = await establishTool<D3Tool>('d3-visualiser');

        state.view?.destroy(); // Discard any earlier view so a retry replaces it rather than rendering a second one.
        state.view = null;
        if (container.value) state.view = await d3Tool.renderNetworkDiagram(data, container.value);
    } catch (error) {
        renderFailure.value = raiseFailure(new AppError('Failed to render network diagram.', 'dpuse-app.EventQueriesPanel.renderDiagram', { typeId: 'handled' }, { cause: error }));
    } finally {
        diagramIsPending.value = false;
    }
}
</script>

<template>
    <StudioLayout>
        <StudioHeader class="flex-none px-4" :overline="t(TEXT, 'studio.label')" :title="t(TEXT, 'contextualiseData.title')" :to="{ name: 'studio', query: route.query }" />

        <Separator />

        <ErrorNotice v-if="renderFailure" :failures="[renderFailure]" @retry="handleRetry" />

        <div v-show="!renderFailure" class="px-4 py-2">
            <RectangleButton variant="outline" @click="handleAutoLayout">{{ t(TEXT, 'autoLayout.label') }}</RectangleButton>
        </div>

        <BusyBar v-if="diagramIsPending" class="mx-4" />
        <div v-show="!renderFailure" ref="container" :aria-busy="diagramIsPending" class="w-full flex-1" />
    </StudioLayout>
</template>
