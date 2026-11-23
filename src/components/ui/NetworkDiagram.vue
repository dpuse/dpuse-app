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
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// TODO: Use 'NetworkDiagramOptions' alone once the app takes the d3 tool release whose types include these options.
type DiagramOptions = NetworkDiagramOptions & {
    actionNodeColors?: { border: string; fill: string; fillHovered?: string; symbol: string };
    growsActiveNodes?: boolean;
    hoveredIconNodeColor?: string;
    linkWidth?: number;
};

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Labels go in the widest gap beside each node, wrap onto two lines, and have room kept for them, so the labels round
// a node with many links do not run into one another. The links are short, because the tool lengthens those round a
// busy node by itself. A level too wide for the pane is zoomed out to fit it. The caller keeps the selection, marking
// the selected node with 'isSelected', so the diagram shows the same selection as the rest of the screen. A node is
// drawn as the app's floating pill is: a 1px ring, and the pill's fill behind the icon of the selected node. An action
// node, such as one that adds something, takes all of the pill's colours, because it is the same kind of action. The
// colours are variables, so they follow the theme.
const DIAGRAM_OPTIONS = {
    actionNodeColors: { border: 'var(--color-pill-border)', fill: 'var(--color-pill)', fillHovered: 'var(--color-pill-hover)', symbol: 'var(--color-selected-text)' },
    chargeStrength: -400,
    fitsView: true,
    growsActiveNodes: false, // Every node keeps one size. The selected node and the one under the pointer show in their fill, as the pill does.
    hoveredIconNodeColor: 'var(--color-pill-hover)',
    iconNodeColor: 'var(--color-surface)', // The pane's own background behind a node's icon, so the icon reads as it does elsewhere. A variable, so it follows the theme.
    labelHaloColor: 'var(--color-surface)', // The pane's own background, so a label over a link hides the link behind it. A variable, so it follows the theme.
    labelPlacementId: 'outside',
    linkDistance: 80,
    linkWidth: 1.5, // Narrower than the tool's own lines, to sit with the 1px rings.
    nodeBorderWidth: 1,
    reservesLabelRoom: true,
    selectedIconNodeColor: 'var(--color-pill)',
    selectsOnClick: false,
    wrapsLabels: true
} satisfies DiagramOptions;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { data, label } = defineProps<{
    data: { links: NetworkDiagramLink[]; nodes: TNode[] } | undefined; // Undefined until the caller has something to draw.
    label: string; // Names the diagram for screen readers.
}>();
const emit = defineEmits<{ nodeClick: [node: TNode] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const containerElement = useTemplateRef<HTMLDivElement>('container');
const diagramIsPending = ref(true); // The diagram area is blank while the d3 tool downloads and draws, so the wait is shown.
const diagramView = shallowRef<D3NetworkView>();
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
        const view = await d3Tool.renderNetworkDiagram(data, containerElement.value, { ...DIAGRAM_OPTIONS, onNodeClick: handleClickNode });
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
        <div v-show="!renderFailure" ref="container" :aria-busy="diagramIsPending" :aria-label="label" class="min-h-0 w-full flex-1" role="group" />
    </div>
</template>
