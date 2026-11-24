<script setup lang="ts" generic="TNode extends NetworkDiagramNode">
// Draws a network of nodes and links with the d3 tool, and keeps the drawing in step with its data. New data changes
// the diagram in place: nodes that stay keep their places, new ones fade in and old ones fade out. A caller that shows
// one level of a hierarchy at a time gets a drill-down by handing over each level's data as the user moves.

// ── External Dependencies & Registrations
import { useResizeObserver } from '@vueuse/core';
import { onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { D3NetworkView, Tool as D3Tool, NetworkDiagramLink, NetworkDiagramNode, NetworkDiagramOptions } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { establishTool } from '@/services/tools';
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Static Components
import BusyBar from '@/components/ui/BusyBar.vue';
import DiagramZoomControls from '@/components/ui/DiagramZoomControls.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// TODO: Use 'NetworkDiagramOptions' and 'D3NetworkView' alone once the app takes the d3 tool release whose types include
// these options and methods.
type DiagramOptions = NetworkDiagramOptions & { compactWidth?: number; disablesNodeDrag?: boolean; disablesPointerZoom?: boolean; fitAlignmentId?: 'middle' | 'top'; maximumFitScale?: number; maximumLabelLength?: number };
type DiagramView = D3NetworkView & { fitView?: () => void; zoomBy?: (factor: number) => void };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Labels go in the widest gap beside each node, wrap onto two lines, and have room kept for them, so the labels round
// a node with many links do not run into one another. The links are short, because the tool lengthens those round a
// busy node by itself. A level too wide for the pane is zoomed out to fit it. The caller keeps the selection, marking
// the selected node with 'isSelected', so the diagram shows the same selection as the rest of the screen. A node is
// drawn as the app's floating pill is, with a 1px ring, and the selected node has a second ring round it. An action
// node, such as one that adds something, takes all of the pill's colours, because it is the same kind of action. The
// colours are variables, so they follow the theme.
const DIAGRAM_OPTIONS = {
    compactWidth: 480, // On a pane as narrow as a phone, labels go below their nodes, which leaves more of the width to the nodes.
    actionNodeColors: { border: 'var(--color-pill-border)', fill: 'var(--color-pill)', fillHovered: 'var(--color-pill-hover)', symbol: 'var(--color-selected-text)' },
    chargeStrength: -400,
    disablesNodeDrag: true,
    disablesPointerZoom: true, // The wheel scrolls the page past the diagram. The zoom buttons still zoom.
    fitAlignmentId: 'top', // A small diagram stays near the headings and the detail text, rather than floating in the middle of a tall pane.
    fitsView: true,
    focusRingColor: 'var(--color-focus-ring)',
    growsActiveNodes: false, // Every node keeps one size. The selected node and the one under the pointer show in their fill, as the pill does.
    hoveredIconNodeColor: 'var(--color-pill-hover)',
    iconNodeColor: 'var(--color-surface)', // The pane's own background behind a node's icon, so the icon reads as it does elsewhere. A variable, so it follows the theme.
    labelHaloColor: 'var(--color-surface)', // The pane's own background, so a label over a link hides the link behind it. A variable, so it follows the theme.
    labelPlacementId: 'outside',
    linkDistance: 80,
    linkWidth: 1, // As wide as the rings round the nodes.
    maximumFitScale: 1, // A small diagram is never enlarged, so its icons and labels match the rest of the app. Only the user's own zoom makes it larger.
    maximumLabelLength: 24, // A longer name, such as a file named by an id, is cut short. The whole name is the node's tooltip.
    nodeBorderWidth: 1,
    reservesLabelRoom: true,
    selectedRingColor: 'var(--color-focus-ring)', // A ring a little apart from the selected node, as the app's focus ring sits round a control. The ring for keyboard focus is drawn outside it.
    selectsOnClick: false,
    wrapsLabels: true
} satisfies DiagramOptions;

const ZOOM_STEP = 1.25; // How much one press of a zoom button enlarges the diagram.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { data, label, linkColor } = defineProps<{
    data: { links: NetworkDiagramLink[]; nodes: TNode[] } | undefined; // Undefined until the caller has something to draw.
    label: string; // Names the diagram for screen readers.
    linkColor?: string; // The colour of the lines between nodes, for a caller whose nodes have their own colours. Any CSS colour. Read once, when the diagram is first drawn.
}>();
const emit = defineEmits<{ nodeClick: [node: TNode] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const containerElement = useTemplateRef<HTMLDivElement>('container');
const diagramIsPending = ref(true); // The diagram area is blank while the d3 tool downloads and draws, so the wait is shown.
const diagramView = shallowRef<DiagramView>();
const renderFailure = shallowRef<AppFailure | undefined>();
const renderCount = ref(0); // Tells a render that a newer one has started while it waited for the tool, so it keeps nothing it drew.

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Drawn once there is data and the container is on the page. Later data changes the drawing in place.
watch(
    [(): typeof data => data, containerElement],
    () => {
        if (data == null || diagramView.value == null) void renderDiagram();
        else diagramView.value.update(data);
    },
    { immediate: true }
);

// The pane can be resized by its splitter, which the window's own resize event does not report.
useResizeObserver(containerElement, () => {
    diagramView.value?.resize();
});

onBeforeUnmount(destroyDiagram);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetry(): void {
    void renderDiagram();
}

function handleZoomIn(): void {
    diagramView.value?.zoomBy(ZOOM_STEP);
}

function handleZoomOut(): void {
    diagramView.value?.zoomBy(1 / ZOOM_STEP);
}

function handleFit(): void {
    diagramView.value?.fitView();
}

// The tool hands back the node it was given, which is one of the caller's own.
function handleClickNode(node: NetworkDiagramNode): void {
    const clickedNode = data?.nodes.find((candidate) => candidate.id === node.id);
    if (clickedNode) emit('nodeClick', clickedNode);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function renderDiagram(): Promise<void> {
    if (data == null || containerElement.value == null) return;

    const thisRenderCount = ++renderCount.value;
    renderFailure.value = undefined;
    diagramIsPending.value = true;
    try {
        destroyDiagram(); // A retry replaces the diagram rather than drawing a second one.
        const d3Tool = await establishTool<D3Tool>('d3-visualiser');
        const view = await d3Tool.renderNetworkDiagram(data, containerElement.value, { ...DIAGRAM_OPTIONS, ...(linkColor != null && { linkColor }), onNodeClick: handleClickNode });
        if (thisRenderCount !== renderCount.value) {
            view.destroy();
            return;
        }
        view.resize(); // The container may have changed size while the tool was drawing, when there was no diagram yet to tell.
        view.triggerAutoLayout(); // The tool first places every node on one circle, which hides which node belongs to which.
        diagramView.value = view;
    } catch (error) {
        renderFailure.value = raiseFailure(new AppError('Failed to render the diagram.', 'dpuse-app.NetworkDiagram.renderDiagram', { data: { typeId: 'handled' }, cause: error }));
    } finally {
        if (thisRenderCount === renderCount.value) diagramIsPending.value = false;
    }
}

function destroyDiagram(): void {
    diagramView.value?.destroy();
    diagramView.value = undefined;
}
</script>

<template>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col" data-region="NetworkDiagram">
        <ErrorNotice v-if="renderFailure" :failures="[renderFailure]" @retry="handleRetry" />

        <BusyBar v-if="diagramIsPending" class="mx-page flex-none" />

        <!-- 'v-show' rather than 'v-if' ─ The container stays on the page, so a retry after a failure has an element to
             draw into. -->
        <div v-show="!renderFailure" class="relative min-h-0 w-full flex-1">
            <div ref="container" :aria-busy="diagramIsPending" :aria-label="label" class="absolute inset-0" role="group" />

            <!-- Zoom ─ Only for a diagram drawn by a tool that can zoom. -->
            <DiagramZoomControls v-if="diagramView?.zoomBy" class="absolute top-2 right-2" @fit="handleFit" @zoom-in="handleZoomIn" @zoom-out="handleZoomOut" />
        </div>
    </div>
</template>
