<script setup lang="ts">
// ── External Dependencies & Registrations
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

// ── DPUse Framework
import type { D3NetworkView, Tool as D3ToolType, NetworkDiagramData } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { t } from '@/state/locale';
import { toolConfigs } from '@/state/session';

// ── Static Components
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '../StudioHeader.vue';
import StudioLayout from '../StudioLayout.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Contextualise_Data: { en: 'Contextualise Data', es: 'Contextualizar Datos' },
    event_queries: { en: 'event queries', es: 'consultas de eventos' },
    Event_Query: { en: 'Event Query', es: 'Consulta de Eventos' },
    'wb.label': { en: 'Workflow', es: 'Flujo de Trabajo' }
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

const container = ref<HTMLDivElement | null>(null);
const state: { view: D3NetworkView | null } = { view: null };

const onAutoLayout = (): void => {
    state.view?.triggerAutoLayout();
};

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

const toolReady = new Promise<void>((resolve) => {
    watch(
        toolConfigs,
        (newToolConfigs) => {
            if (newToolConfigs.length === 0) return;
            resolve();
        },
        { immediate: true }
    );
});

onMounted(async () => {
    await toolReady;
    if (!container.value) return;

    const d3Tool = await loadD3Tool();
    state.view = await d3Tool.renderNetworkDiagram(data, container.value);
});

onBeforeUnmount(() => {
    state.view?.destroy();
    state.view = null;
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadD3Tool(): Promise<D3ToolType> {
    const toolModuleConfig = toolConfigs.value.find((config) => config.id === 'dpuse-tool-d3-visualiser');
    if (!toolModuleConfig) throw new Error('No D3 tool module configuration.');

    const url = `https://engine-eu.dpuse.app/tools/d3-visualiser_v${toolModuleConfig.version}/dpuse-tool-d3-visualiser.es.js`;
    const module = (await import(/* @vite-ignore */ url)) as { Tool: new () => D3ToolType };
    const D3Tool = module.Tool;
    return new D3Tool();
}
</script>

<template>
    <StudioLayout>
        <StudioHeader class="flex-none px-4" overline="Studio" :title="t(T, 'Contextualise_Data')" to="studio" />

        <Separator />
        <div class="px-4 py-2">
            <button class="rounded-md border border-boundary bg-card px-3 py-1.5 text-sm font-medium text-emphasis hover:bg-card-hover" type="button" @click="onAutoLayout">
                Auto-layout
            </button>
        </div>
        <div ref="container" class="w-full flex-1" />
    </StudioLayout>
</template>
