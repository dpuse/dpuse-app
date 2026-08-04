<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, useTemplateRef, watch } from 'vue';

// ── DPUse Framework
import type { BarChartData, D3Tool as D3ToolType, SankeyDiagramData } from '@dpuse/dpuse-tool-d3-visualiser';

// Local Framework
import { t } from '@/state/locale';
import T from './BuildDataAppsLayout.json';
import { toolConfigs } from '@/state/session';

// Local Components - Static
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const d3SankeyTestContainer = useTemplateRef<HTMLDivElement>('d3SankeyTestContainer');
const d3BarChartTestContainer = useTemplateRef<HTMLDivElement>('d3BarChartTestContainer');
const d3PlotBarChartTestContainer = useTemplateRef<HTMLDivElement>('d3PlotBarChartTestContainer');
const d3NativeBarChartTestContainer = useTemplateRef<HTMLDivElement>('d3NativeBarChartTestContainer');
const d3TanStackChartsTestContainer = useTemplateRef<HTMLDivElement>('d3TanStackChartsTestContainer');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────
// TODO(test): dpuse-tool-d3 Sankey diagram & bar chart (Billboard.js and Observable Plot, same data) smoke test -
// remove once the tool has real call sites. Loaded from https://engine-eu.dpuse.app/tools/..., the same way
// dpuse-presenter-default.loadHighchartsTool()/loadMicromarkTool() load their tools - toolConfigs carries each
// released tool's id/version, resolved into the download URL below. The Billboard.js bar chart also needs its
// stylesheet loaded from the same origin - see ensureD3ToolStylesheetLoaded(). Observable Plot needs no stylesheet.

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

    const toolModuleConfig = toolConfigs.value.find((config) => config.id === 'dpuse-tool-d3-visualiser');
    if (!toolModuleConfig) throw new Error('No D3 tool module configuration.');

    ensureD3ToolStylesheetLoaded(toolModuleConfig.version);
    const d3Tool = await loadD3Tool(toolModuleConfig.version);

    if (d3SankeyTestContainer.value) {
        const sankeyData: SankeyDiagramData = {
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
        await d3Tool.renderSankeyDiagram(sankeyData, d3SankeyTestContainer.value);
    }

    const barChartData: BarChartData = {
        categories: ['Q1', 'Q2', 'Q3', 'Q4'],
        series: [
            { name: 'Revenue', values: [30, 200, 100, 400] },
            { name: 'Cost', values: [130, 100, 140, 200] }
        ]
    };

    if (d3BarChartTestContainer.value) await d3Tool.renderBillboardJS(barChartData, d3BarChartTestContainer.value);
    if (d3PlotBarChartTestContainer.value) await d3Tool.renderObservablePlot('bar', barChartData, d3PlotBarChartTestContainer.value);
    if (d3NativeBarChartTestContainer.value) await d3Tool.renderD3BarChart(barChartData, d3NativeBarChartTestContainer.value);
    if (d3TanStackChartsTestContainer.value) await d3Tool.renderTanStackCharts(barChartData, d3TanStackChartsTestContainer.value);
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadD3Tool(version: string): Promise<D3ToolType> {
    const url = `https://engine-eu.dpuse.app/tools/d3-visualiser_v${version}/dpuse-tool-d3-visualiser.es.js`;
    const module = (await import(/* @vite-ignore */ url)) as { D3Tool: new () => D3ToolType };
    const D3Tool = module.D3Tool;
    return new D3Tool();
}

// Billboard.js (used by renderBillboardJS) requires its own stylesheet - unlike the SVG-only renderers, it won't look
// right without it. Injected as a <link> from the same engine origin the tool's JS already loads from, guarded so a
// second mount doesn't insert it twice.
function ensureD3ToolStylesheetLoaded(version: string): void {
    const href = `https://engine-eu.dpuse.app/tools/d3-visualiser_v${version}/dpuse-tool-d3-visualiser.css`;
    if (document.head.querySelector(`link[href="${CSS.escape(href)}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
}
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Build_Data_Apps')" to="workbench" />

        <ScrollArea class="flex-1" scroll-area-padding="screen">
            <div class="relative flex min-h-0 flex-1 flex-col">
                <Separator class="mx-4" />

                <!-- TODO(test): dpuse-tool-d3 Sankey diagram smoke test - remove once the tool has a real call site. -->
                <div class="flex-none px-4 pt-4">
                    <p class="mb-2 text-sm text-subtle">dpuse-tool-d3 test - Sankey diagram</p>
                    <div ref="d3SankeyTestContainer" class="h-80 w-full" />
                </div>
                <Separator class="mx-4" />

                <!-- TODO(test): dpuse-tool-d3 Billboard.js bar chart smoke test - remove once the tool has a real call site. -->
                <div class="flex-none px-4 pt-4">
                    <p class="mb-2 text-sm text-subtle">dpuse-tool-d3 test - Bar chart (Billboard.js)</p>
                    <div ref="d3BarChartTestContainer" class="h-80 w-full" />
                </div>
                <Separator class="mx-4" />

                <!-- TODO(test): dpuse-tool-d3 Observable Plot bar chart smoke test - remove once the tool has a real call site. -->
                <div class="flex-none px-4 pt-4">
                    <p class="mb-2 text-sm text-subtle">dpuse-tool-d3 test - Bar chart (Observable Plot)</p>
                    <div ref="d3PlotBarChartTestContainer" class="h-80 w-full" />
                </div>
                <Separator class="mx-4" />

                <!-- TODO(test): dpuse-tool-d3 native D3 bar chart smoke test - remove once the tool has a real call site. -->
                <div class="flex-none px-4 pt-4">
                    <p class="mb-2 text-sm text-subtle">dpuse-tool-d3 test - Bar chart (D3)</p>
                    <div ref="d3NativeBarChartTestContainer" class="h-80 w-full" />
                </div>
                <Separator class="mx-4" />

                <!-- TODO(test): dpuse-tool-d3 TanStack Charts bar chart smoke test - remove once the tool has a real call site. -->
                <div class="flex-none px-4 pt-4">
                    <p class="mb-2 text-sm text-subtle">dpuse-tool-d3 test - Bar chart (TanStack Charts)</p>
                    <div ref="d3TanStackChartsTestContainer" class="h-80 w-full" />
                </div>
                <Separator class="mx-4" />

                <RouterView />
            </div>
        </ScrollArea>
    </WorkbenchLayout>
</template>
