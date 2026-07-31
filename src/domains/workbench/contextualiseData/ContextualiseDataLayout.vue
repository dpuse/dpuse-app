<script setup lang="ts">
// ── External Dependencies & Registrations
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

// ── DPUse Framework
import type { D3NetworkView, D3Tool as D3ToolType, NetworkDiagramData } from '@dpuse/dpuse-tool-d3';

// ── Local Framework
import { t } from '@/state/locale';
import T from './ContextualiseDataLayout.json';
import { toolConfigs } from '@/state/session';

// ── Local Components - Static
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

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
    state.view = d3Tool.renderNetworkDiagram(data, container.value);
});

onBeforeUnmount(() => {
    state.view?.destroy();
    state.view = null;
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadD3Tool(): Promise<D3ToolType> {
    const toolModuleConfig = toolConfigs.value.find((config) => config.id === 'dpuse-tool-d3');
    if (!toolModuleConfig) throw new Error('No D3 tool module configuration.');

    const url = `https://engine-eu.dpuse.app/tools/d3_v${toolModuleConfig.version}/dpuse-tool-d3.es.js`;
    const module = (await import(/* @vite-ignore */ url)) as { D3Tool: new () => D3ToolType };
    const D3Tool = module.D3Tool;
    return new D3Tool();
}
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Contextualise_Data')" to="workbench" />

        <!-- <div class="relative flex min-h-0 flex-1 flex-col">
            <Separator class="mx-4" />
            <RouterView />
        </div> -->

        <Separator class="mx-4" />
        <div class="px-4 py-2">
            <button class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50" type="button" @click="onAutoLayout">
                Auto-layout
            </button>
        </div>
        <div ref="container" class="w-full flex-1" />
    </WorkbenchLayout>
</template>
