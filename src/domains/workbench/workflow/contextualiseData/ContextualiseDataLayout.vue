<script setup lang="ts">
// Local (App) Framework
import { t } from '@/state/locale';
import T from './ContextualiseDataLayout.json';

// Local Components - Static
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';

import { drag } from 'd3-drag';
import { select } from 'd3-selection';
import { forceCenter, forceLink, forceManyBody, forceSimulation, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force';
import { onMounted, ref } from 'vue';

type GraphNode = SimulationNodeDatum & { id: string };
type GraphLink = SimulationLinkDatum<GraphNode>;

const svg = ref<SVGSVGElement | null>(null);
const container = ref<HTMLDivElement | null>(null);

onMounted(() => {
    if (!container.value) return;

    const width = container.value.offsetWidth;
    const height = container.value.offsetHeight;

    const nodes: GraphNode[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const links: GraphLink[] = [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'C' }
    ];

    const sim = forceSimulation(nodes)
        .force(
            'link',
            forceLink<GraphNode, GraphLink>(links)
                .id((d) => d.id)
                .distance(100)
        )
        .force('charge', forceManyBody().strength(-300))
        .force('center', forceCenter(width / 2, height / 2));

    const svg = select(container.value).append('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const link = svg.selectAll<SVGLineElement, GraphLink>('line').data(links).join('line').attr('stroke', '#999');

    const node = svg.selectAll<SVGGElement, GraphNode>('g').data(nodes).join('g');
    node.append('circle').attr('r', 20).attr('fill', 'steelblue');
    node.append('text')
        .text((d) => d.id)
        .attr('text-anchor', 'middle')
        .attr('dy', 4)
        .attr('fill', '#ffffff'); // explicit — iOS Safari can default to transparent

    node.call(
        drag<SVGGElement, GraphNode>()
            .on('start', (event, d) => {
                if (!event.active) sim.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) sim.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            })
    );

    const getNodePosition = (node: GraphNode | string | number, axis: 'x' | 'y'): number => {
        if (typeof node === 'object' && node !== null) {
            return node[axis] ?? 0;
        }

        return 0;
    };

    sim.on('tick', () => {
        link.attr('x1', (d) => getNodePosition(d.source, 'x'))
            .attr('y1', (d) => getNodePosition(d.source, 'y'))
            .attr('x2', (d) => getNodePosition(d.target, 'x'))
            .attr('y2', (d) => getNodePosition(d.target, 'y'));
        node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });
});
</script>

<template>
    <LayoutShell>
        <Header class="mx-4" :overline="t(T, 'wb.label')" :title="t(T, 'Contextualise_Data')" to="workflow" />

        <div ref="container" class="h-150 w-full" />
        <!-- <svg ref="svg" width="100%" height="600" /> -->
        <!-- <RouterView /> -->
    </LayoutShell>
</template>
