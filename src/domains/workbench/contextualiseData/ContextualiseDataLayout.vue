<script setup lang="ts">
// External Dependencies & Registrations
import { drag } from 'd3-drag';
import { select } from 'd3-selection';
import { type D3ZoomEvent, zoom } from 'd3-zoom'; // TODO: This adds about 10kB gzipped bring total to 21.66kB.
import { forceCenter, forceLink, forceManyBody, forceSimulation, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force';
import { onBeforeUnmount, onMounted, ref } from 'vue';

// Local (App) Framework
import { t } from '@/state/locale';
import T from './ContextualiseDataLayout.json';

// Local Components - Static
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// Types ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

type GraphNode = SimulationNodeDatum & { id: string };
type GraphLink = SimulationLinkDatum<GraphNode>;

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const container = ref<HTMLDivElement | null>(null);
const state: { cleanup: (() => void) | null; triggerAutoLayout: (() => void) | null } = { cleanup: null, triggerAutoLayout: null };

const onAutoLayout = (): void => {
    state.triggerAutoLayout?.();
};

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    if (!container.value) return;

    const width = container.value.offsetWidth;
    const height = container.value.offsetHeight;

    const nodes: GraphNode[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' }, { id: 'F' }, { id: 'G' }, { id: 'H' }, { id: 'I' }, { id: 'J' }];
    const links: GraphLink[] = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'C' },
        { source: 'D', target: 'C' },
        { source: 'E', target: 'D' },
        { source: 'F', target: 'D' },
        { source: 'G', target: 'D' },
        { source: 'H', target: 'F' },
        { source: 'I', target: 'F' },
        { source: 'J', target: 'F' }
    ];

    // Set deterministic initial positions so the graph is readable before force layout runs.
    const startRadius = Math.min(width, height) * 0.22;
    for (const [index, node] of nodes.entries()) {
        const angle = (index / nodes.length) * Math.PI * 2;
        node.x = width / 2 + Math.cos(angle) * startRadius;
        node.y = height / 2 + Math.sin(angle) * startRadius;
    }

    const sim = forceSimulation(nodes)
        .force(
            'link',
            forceLink<GraphNode, GraphLink>(links)
                .id((d) => d.id)
                .distance(100)
        )
        .force('charge', forceManyBody().strength(-300))
        .force('center', forceCenter(width / 2, height / 2));

    const svg = select(container.value).append('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`).style('touch-action', 'none');
    const viewport = svg.append('g');

    const link = viewport.selectAll<SVGLineElement, GraphLink>('line').data(links).join('line').attr('stroke', '#9ca3af').attr('stroke-width', 2);

    const node = viewport.selectAll<SVGGElement, GraphNode>('g').data(nodes).join('g').style('cursor', 'pointer');
    node.append('circle').attr('r', 20).attr('fill', '#2563eb').attr('stroke', '#1d4ed8').attr('stroke-width', 2);
    node.append('text')
        .text((d) => d.id)
        .attr('text-anchor', 'middle')
        .attr('dy', 4)
        .attr('fill', '#ffffff'); // explicit — iOS Safari can default to transparent

    let selectedNodeId: string | null = null;
    let hoveredNodeId: string | null = null;

    const updateNodeStyles = (): void => {
        node.selectAll<SVGCircleElement, GraphNode>('circle')
            .attr('fill', (d) => {
                if (d.id === selectedNodeId) return '#f59e0b';
                if (d.id === hoveredNodeId) return '#3b82f6';
                return '#2563eb';
            })
            .attr('stroke', (d) => {
                if (d.id === selectedNodeId) return '#b45309';
                if (d.id === hoveredNodeId) return '#1d4ed8';
                return '#1e40af';
            })
            .attr('stroke-width', (d) => (d.id === selectedNodeId ? 3 : 2))
            .attr('r', (d) => (d.id === selectedNodeId || d.id === hoveredNodeId ? 22 : 20));
    };

    node.on('mouseenter', (_, d) => {
        hoveredNodeId = d.id;
        updateNodeStyles();
    })
        .on('mouseleave', (_, d) => {
            if (hoveredNodeId === d.id) hoveredNodeId = null;
            updateNodeStyles();
        })
        .on('click', (event, d) => {
            event.stopPropagation();
            selectedNodeId = selectedNodeId === d.id ? null : d.id;
            updateNodeStyles();
        });

    svg.on('click', () => {
        selectedNodeId = null;
        updateNodeStyles();
    });

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 4])
        .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
            viewport.attr('transform', event.transform.toString());
        });

    svg.call(zoomBehavior).on('dblclick.zoom', null);

    const getNodePosition = (value: GraphNode | string | number, axis: 'x' | 'y'): number => {
        if (typeof value === 'object' && value != null) {
            return value[axis] ?? 0;
        }

        return 0;
    };

    const renderGraph = (): void => {
        link.attr('x1', (d) => getNodePosition(d.source, 'x'))
            .attr('y1', (d) => getNodePosition(d.source, 'y'))
            .attr('x2', (d) => getNodePosition(d.target, 'x'))
            .attr('y2', (d) => getNodePosition(d.target, 'y'));
        node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    };

    // Keep force simulation idle by default; run it only on explicit request.
    sim.stop();

    state.triggerAutoLayout = (): void => {
        sim.alpha(1);

        for (let step = 0; step < 180; step += 1) {
            sim.tick();
        }

        sim.stop();
        renderGraph();
    };

    node.call(
        drag<SVGGElement, GraphNode>()
            .on('start', (event, d) => {
                event.sourceEvent?.stopPropagation();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.x = event.x;
                d.y = event.y;
                d.fx = event.x;
                d.fy = event.y;
                renderGraph();
            })
            .on('end', (_event, d) => {
                d.fx = null;
                d.fy = null;
            })
    );

    renderGraph();

    state.cleanup = (): void => {
        sim.stop();
        state.triggerAutoLayout = null;
        svg.remove();
    };
});

onBeforeUnmount(() => {
    state.cleanup?.();
    state.cleanup = null;
});
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
