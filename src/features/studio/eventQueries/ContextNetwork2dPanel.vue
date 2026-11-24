<script setup lang="ts">
// ── DPUse Framework
import type { Tool as D3Tool, NetworkDiagramOptions } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { establishTool } from '@/services/tools';
import { resolveAppearanceIcon } from '@/state/appearance';
import { t } from '@/state/locale';
import { TEXT } from './ContextNetwork2dPanel_.json';
import { constructRingColor, readIconColor, useStudioOptions } from '@/features/studio/options/useStudioOptions';
import type { ContextDiagramData, ContextDiagramView } from './_contextDiagram';

// ── Static Components
import ContextNetworkPanel from './ContextNetworkPanel.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// TODO: Use 'NetworkDiagramOptions' alone once the app takes the d3 tool release whose types include these options.
type DiagramOptions = NetworkDiagramOptions & { compactWidth?: number; maximumFitScale?: number; maximumLabelLength?: number };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Labels go in the widest gap beside each node, wrap onto two lines, and have room kept for them, so the labels round
// a node with many links do not run into one another. The links are short, because the tool lengthens those round a
// busy node by itself. A level too wide for the pane is zoomed out to fit it. A node is drawn as the data views diagram
// draws its nodes: one size whatever the pointer does, with a 1px ring, and a second ring round the node last clicked.
const DIAGRAM_OPTIONS = {
    chargeStrength: -400,
    compactWidth: 480, // On a pane as narrow as a phone, labels go below their nodes, which leaves more of the width to the nodes.
    fitsView: true,
    focusRingColor: 'var(--color-focus-ring)',
    growsActiveNodes: false,
    hoveredIconNodeColor: 'var(--color-pill-hover)',
    iconNodeColor: 'var(--color-surface)', // The pane's own background behind an area's icon, so the icon reads as it does elsewhere. A variable, so it follows the theme.
    labelHaloColor: 'var(--color-surface)', // The pane's own background, so a label over a link hides the link behind it. A variable, so it follows the theme.
    labelPlacementId: 'outside',
    linkDistance: 80,
    linkWidth: 1, // As wide as the rings round the nodes.
    maximumFitScale: 1.5, // A small level is enlarged to use a large pane, but not so far that its labels are larger than the headings round it.
    maximumLabelLength: 24, // A longer name is cut short. The whole name is the node's tooltip.
    nodeBorderWidth: 1,
    reservesLabelRoom: true,
    selectedRingColor: 'var(--color-focus-ring)',
    wrapsLabels: true
} satisfies DiagramOptions;

const SETUP_OPTION_ID = 'setup'; // The studio option whose colour the lines take, as the nodes they join do.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const studioOptionLocalisedConfigs = useStudioOptions();

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function renderContextDiagram(data: ContextDiagramData, renderTo: HTMLElement, onNodeClick: (node: { id: string }) => void): Promise<ContextDiagramView> {
    const d3Tool = await establishTool<D3Tool>('d3-visualiser');
    const setupOption = studioOptionLocalisedConfigs.value.find((config) => config.id === SETUP_OPTION_ID);
    const linkColor = constructRingColor(readIconColor(resolveAppearanceIcon(setupOption?.icon, setupOption?.iconDark)));
    const view = await d3Tool.renderNetworkDiagram(data, renderTo, { ...DIAGRAM_OPTIONS, ...(linkColor != null && { linkColor }), onNodeClick });
    view.triggerAutoLayout(); // The tool first places every node on one circle, which hides which node belongs to which.
    return view;
}
</script>

<template>
    <ContextNetworkPanel :hint="t(TEXT, 'hint.text')" :render-context-diagram="renderContextDiagram" />
</template>
