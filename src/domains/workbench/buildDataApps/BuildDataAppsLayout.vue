<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, useTemplateRef, watch } from 'vue';

// Local Framework
import { t } from '@/state/locale';
import T from './BuildDataAppsLayout.json';
import { toolConfigs } from '@/state/session';

// Local Components - Static
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────
// TODO(test): remove this block once dpuse-tool-d3 has a real call site. Types match the tool's own public exports;
// duplicated here rather than depending on the package, since this module is dynamically imported at runtime from
// the engine cloud, not installed as a build-time dependency.

interface D3SankeyDiagramData {
    links: { source: string; target: string; value: number }[];
    nodes: { id: string; name: string }[];
}

interface D3ToolInterface {
    renderSankeyDiagram: (data: D3SankeyDiagramData, renderTo: HTMLElement) => { resize: () => void; svg: SVGSVGElement; vendorId: string };
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const d3SankeyTestContainer = useTemplateRef<HTMLDivElement>('d3SankeyTestContainer');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────
// TODO(test): dpuse-tool-d3 Sankey diagram smoke test - remove once the tool has a real call site. Loaded from
// https://engine-eu.dpuse.app/tools/..., the same way dpuse-presenter-default.loadHighchartsTool()/loadMicromarkTool()
// load their tools - toolConfigs carries each released tool's id/version, resolved into the download URL below.

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
    if (!d3SankeyTestContainer.value) return;

    const d3Tool = await loadD3Tool();

    const data: D3SankeyDiagramData = {
        links: [
            { source: 'sourcing', target: 'contextualising', value: 8 },
            { source: 'contextualising', target: 'publishing', value: 5 },
            { source: 'contextualising', target: 'archived', value: 3 }
        ],
        nodes: [
            { id: 'sourcing', name: 'Sourcing' },
            { id: 'contextualising', name: 'Contextualising' },
            { id: 'publishing', name: 'Publishing' },
            { id: 'archived', name: 'Archived' }
        ]
    };

    d3Tool.renderSankeyDiagram(data, d3SankeyTestContainer.value);
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadD3Tool(): Promise<D3ToolInterface> {
    const toolModuleConfig = toolConfigs.value.find((config) => config.id === 'dpuse-tool-d3');
    if (!toolModuleConfig) throw new Error('No D3 tool module configuration.');

    const url = `https://engine-eu.dpuse.app/tools/d3_v${toolModuleConfig.version}/dpuse-tool-d3.es.js`;
    const module = (await import(/* @vite-ignore */ url)) as { D3Tool: new () => D3ToolInterface };
    const D3Tool = module.D3Tool;
    return new D3Tool();
}
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Build_Data_Apps')" to="workbench" />

        <div class="relative flex min-h-0 flex-1 flex-col">
            <Separator class="mx-4" />

            <!-- TODO(test): dpuse-tool-d3 Sankey diagram smoke test - remove once the tool has a real call site. -->
            <div class="flex-none px-4 pt-4">
                <p class="mb-2 text-sm text-subtle">dpuse-tool-d3 test - Sankey diagram</p>
                <div ref="d3SankeyTestContainer" class="h-80 w-full" />
            </div>
            <Separator class="mx-4" />

            <RouterView />
        </div>
    </WorkbenchLayout>
</template>
