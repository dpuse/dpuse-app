<script setup lang="ts">
// ── DPUse Framework
import type { Tool as D3Tool, NetworkDiagramOptions } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { establishTool } from '@/services/tools';
import { t } from '@/state/locale';
import { TEXT } from './ContextNetwork2dPanel_.json';
import type { ContextDiagramData, ContextDiagramView } from './_contextDiagram';

// ── Static Components
import ContextNetworkPanel from './ContextNetworkPanel.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Labels go in the widest gap beside each node, wrap onto two lines, and have room kept for them, so the labels round
// a node with many links do not run into one another. The links are short, because the tool lengthens those round a
// busy node by itself. A level too wide for the pane is zoomed out to fit it.
const DIAGRAM_OPTIONS = {
    chargeStrength: -400,
    fitsView: true,
    labelHaloColor: 'var(--color-surface)', // The pane's own background, so a label over a link hides the link behind it. A variable, so it follows the theme.
    labelPlacementId: 'outside',
    linkDistance: 80,
    reservesLabelRoom: true,
    wrapsLabels: true
} satisfies NetworkDiagramOptions;

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function renderContextDiagram(data: ContextDiagramData, renderTo: HTMLElement, onNodeClick: (node: { id: string }) => void): Promise<ContextDiagramView> {
    const d3Tool = await establishTool<D3Tool>('d3-visualiser');
    const view = await d3Tool.renderNetworkDiagram(data, renderTo, { ...DIAGRAM_OPTIONS, onNodeClick });
    view.triggerAutoLayout(); // The tool first places every node on one circle, which hides which node belongs to which.
    return view;
}
</script>

<template>
    <ContextNetworkPanel :hint="t(TEXT, 'hint.text')" :render-context-diagram="renderContextDiagram" />
</template>
