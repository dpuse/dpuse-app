<script setup lang="ts">
// ── External Dependencies & Registrations
import * as dagre from '@dagrejs/dagre';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { select } from 'd3-selection';
import { ChevronRightIcon, PencilIcon } from '@lucide/vue';
import { onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBase } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Components - Static
import type { GridListItem } from './ContextList.vue';

// ── Data
import modelConfigs from './modelConfigs.json';

// ── Local Components - Static
import BaseDialog from '@/components/ui/dialog/BaseDialog.vue';
import Button from '@/components/ui/button/Button.vue';
import Input from '@/components/ui/Input.vue';
import TextEditor from '@/components/ui/TextEditor.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type Entity = { id: string; label: Record<string, string>; description: Record<string, string> };
type Model = { entities: Entity[] };

type LocalisedEntity = { id: string; label: string; description: string };
type LocalisedModel = { entities: LocalisedEntity[] };

type ErdNodeType = 'primary' | 'child';
type ErdNode = { id: string; label: string; type: ErdNodeType };
type ErdEdge = { source: string; target: string };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENTITY_TABS = [
    { id: 'parents', label: 'Parents' },
    { id: 'characteristics', label: 'Characteristics' },
    { id: 'events', label: 'Events' },
    { id: 'primaryMeasures', label: 'Measures' }
];

// Evaluation example: hard-coded ERD fed through dagre for layout, drawn with d3-selection.
const ERD_NODES: ErdNode[] = [
    { id: 'organisation', label: 'Organisation', type: 'primary' },
    { id: 'organisationalUnit', label: 'Organisational Unit', type: 'child' },
    { id: 'person', label: 'Person', type: 'primary' },
    { id: 'nationality', label: 'Nationality', type: 'child' },
    { id: 'language', label: 'Language', type: 'child' }
];

const ERD_EDGES: ErdEdge[] = [
    { source: 'organisation', target: 'organisationalUnit' },
    { source: 'person', target: 'nationality' },
    { source: 'person', target: 'language' }
];

const ERD_NODE_WIDTH = 160;
const ERD_NODE_HEIGHT = 50;

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { modelReference } = defineProps<{ modelReference: GridListItem<LocalisedConfig<ComponentBase>> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeModel = shallowRef();
const activeEntityTab = shallowRef(ENTITY_TABS[0]);
const expandedEntityId = ref<string | null>(null);
const open = ref(false);
const purifiedDescription = ref('');
const modelDescription = ref('');
const modelReferenceLabel = ref('');
const modelMap = modelConfigs as Record<string, Model>;
const erdSvgElement = useTemplateRef<SVGSVGElement>('erdSvg');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    if (erdSvgElement.value) renderErd(erdSvgElement.value);
});

watch(
    () => modelReference,
    (newModelReference) => {
        purifiedDescription.value = DOMPurify.sanitize(marked.parse(newModelReference.description, { async: false }));
        modelDescription.value = newModelReference.description + newModelReference.description + newModelReference.description + newModelReference.description;
        modelReferenceLabel.value = newModelReference.label;
        activeModel.value = localiseModel(modelMap[newModelReference.id]);
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function toggleEntity(entityId: string): void {
    expandedEntityId.value = expandedEntityId.value === entityId ? null : entityId;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function localiseModel(model: Model): LocalisedModel {
    const localisedEntities: LocalisedEntity[] = Array.from(model.entities, (entity) => ({ ...entity, label: entity.label.en, description: entity.description.en }));
    return { ...model, entities: localisedEntities };
}

function purifyText(text: string): string {
    return DOMPurify.sanitize(marked.parse(text, { async: false }));
}

function renderErd(svgElement: SVGSVGElement): void {
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 60 });
    graph.setDefaultEdgeLabel(() => ({}));

    for (const node of ERD_NODES) graph.setNode(node.id, { width: ERD_NODE_WIDTH, height: ERD_NODE_HEIGHT, label: node.label, type: node.type });
    for (const edge of ERD_EDGES) graph.setEdge(edge.source, edge.target);

    dagre.layout(graph);

    const { width: graphWidth = 0, height: graphHeight = 0 } = graph.graph();
    const svg = select(svgElement).attr('viewBox', `0 0 ${graphWidth} ${graphHeight}`).attr('width', graphWidth).attr('height', graphHeight);
    svg.selectAll('*').remove();

    svg.append('defs')
        .append('marker')
        .attr('id', 'erd-arrow')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 9)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', '#6c8ebf');

    svg.append('g')
        .attr('fill', 'none')
        .attr('stroke', '#6c8ebf')
        .attr('stroke-width', 1.5)
        .selectAll('path')
        .data(graph.edges())
        .join('path')
        .attr('marker-end', 'url(#erd-arrow)')
        .attr('d', (edge) =>
            graph
                .edge(edge)
                .points.map((point: { x: number; y: number }, index: number) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                .join(' ')
        );

    const nodeGroups = svg
        .append('g')
        .selectAll('g')
        .data(graph.nodes())
        .join('g')
        .attr('transform', (nodeId) => {
            const node = graph.node(nodeId);
            return `translate(${node.x - node.width / 2}, ${node.y - node.height / 2})`;
        });

    nodeGroups
        .append('rect')
        .attr('width', (nodeId) => graph.node(nodeId).width)
        .attr('height', (nodeId) => graph.node(nodeId).height)
        .attr('rx', 6)
        .attr('fill', (nodeId) => (graph.node(nodeId).type === 'primary' ? '#d5e8d4' : '#dae8fc'))
        .attr('stroke', (nodeId) => (graph.node(nodeId).type === 'primary' ? '#82b366' : '#6c8ebf'));

    nodeGroups
        .append('text')
        .attr('x', (nodeId) => graph.node(nodeId).width / 2)
        .attr('y', (nodeId) => graph.node(nodeId).height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-family', 'Helvetica, Arial, sans-serif')
        .attr('font-size', 12)
        .attr('fill', '#000000')
        .text((nodeId) => graph.node(nodeId).label);
}
</script>

<template>
    <div class="dpuse-prose flex-1 overflow-y-auto overscroll-y-none px-4">
        <div class="max-w-prose">
            <!-- Header -->
            <div class="flex flex-none items-center gap-x-3 pt-3">
                <h1 class="">{{ modelReference.label }} Model</h1>
                <Button class="" shape="minimal" @click="open = true">
                    <PencilIcon class="size-5" stroke-width="1.25" />
                </Button>
            </div>

            <!-- Description -->
            <div v-html="purifiedDescription" />

            <BaseDialog v-model="open" :title="`${modelReference.label} Descriptors`" @save="open = false">
                <div class="flex min-h-0 max-w-prose flex-1 flex-col gap-y-4 overflow-x-hidden overflow-y-auto overscroll-y-none px-6 py-4">
                    <Input v-model="modelReferenceLabel" label="Label" />
                    <TextEditor v-model="modelDescription" class="min-h-25 flex-1" label="Description" />
                </div>
            </BaseDialog>

            <h3>Schematic</h3>

            <!-- <svg viewBox="-0.5 -0.5 451 171" width="451" height="171">
                <rect x="0" y="0" width="120" height="60" fill="#d5e8d4" stroke="#82b366" />
                <text x="60" y="34" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#000000">Organisation</text>
                <rect x="250" y="0" width="120" height="60" fill="#d5e8d4" stroke="#82b366" />
                <text x="310" y="34" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#000000">Person</text>
                <rect x="0" y="110" width="120" height="60" fill="#dae8fc" stroke="#6c8ebf" />
                <text x="60" y="144" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#000000">Organisational Unit</text>
                <rect x="170" y="110" width="120" height="60" fill="#dae8fc" stroke="#6c8ebf" />
                <text x="230" y="144" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#000000">Person Language</text>
                <rect x="330" y="110" width="120" height="60" fill="#dae8fc" stroke="#6c8ebf" />
                <text x="390" y="144" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#000000">Person Nationality</text>
                <g fill="none" stroke="#000000" stroke-miterlimit="10">
                    <path d="M 60 60 L 60 94.5" />
                    <path d="M 64 64 L 56 64" />
                    <ellipse cx="60" cy="98" rx="3" ry="3" />
                    <path d="M 64 110 L 60 102 L 56 110 M 60 102 L 60 110" />
                    <path d="M 280 60 L 280 85 L 230 85 L 230 94.5" />
                    <path d="M 284 64 L 276 64" />
                    <ellipse cx="230" cy="98" rx="3" ry="3" />
                    <path d="M 234 110 L 230 102 L 226 110 M 230 102 L 230 110" />
                    <path d="M 340 60 L 340 85 L 390 85 L 390 94.5" />
                    <path d="M 344 64 L 336 64" />
                    <ellipse cx="390" cy="98" rx="3" ry="3" />
                    <path d="M 394 110 L 390 102 L 386 110 M 390 102 L 390 110" />
                    <path d="M 120 140 L 140 140 L 140 80 L 90 80 L 90 94.5" />
                    <path d="M 124 136 L 124 144" />
                    <ellipse cx="90" cy="98" rx="3" ry="3" />
                    <path d="M 86 106 L 94 106 M 90 101.5 L 90 110" />
                </g>
            </svg> -->

            <!-- d3 + dagre evaluation: layout computed by dagre, drawn by d3-selection -->
            <svg ref="erdSvg" />

            <!-- Dimensions -->
            <h2>Dimensions</h2>
            <p>Something about dimensions...</p>

            <!-- Entities -->
            <h2>Entities</h2>
            <p>Something about entities...</p>
            <div
                v-for="entity in activeModel.entities ?? []"
                :key="entity.id"
                class="mt-2 max-w-prose"
                :class="expandedEntityId === entity.id ? 'rounded-md border border-separator' : 'rounded-md'"
            >
                <div
                    role="button"
                    tabindex="0"
                    :aria-expanded="expandedEntityId === entity.id"
                    class="flex items-center gap-x-2 bg-backdrop py-2 pr-4 pl-2"
                    :class="expandedEntityId === entity.id ? 'rounded-t-md' : 'rounded-md'"
                    @click="toggleEntity(entity.id)"
                    @keydown.enter="toggleEntity(entity.id)"
                    @keydown.space.prevent="toggleEntity(entity.id)"
                >
                    <ChevronRightIcon class="size-4.5" stroke-width="1.5" />
                    <div class="flex-1">{{ entity.label }}</div>
                    <Button class="" shape="minimal" @click="open = true">
                        <PencilIcon class="size-4.5" stroke-width="1.25" />
                    </Button>
                </div>
                <div v-if="expandedEntityId === entity.id" class="overflow-y-hidden rounded-b-md px-4 pb-4">
                    <!-- Description -->
                    <div v-html="purifyText(entity.description)" />

                    <!-- Entity Tabs -->
                    <div class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                        <template v-for="entityTab in ENTITY_TABS" :key="entityTab.id">
                            <Button
                                class="border-y-2 border-t-transparent py-1.25"
                                :class="entityTab.id === activeEntityTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                                shape="minimal"
                                @click="activeEntityTab = entityTab"
                            >
                                <div>{{ entityTab.label }}</div>
                            </Button>
                        </template>
                    </div>

                    <!-- Parents Panel -->
                    <div v-show="activeEntityTab.id === 'parents'" class="py-1">
                        <div v-for="parent in entity.parents" :key="parent">
                            {{ parent }}
                        </div>
                    </div>

                    <!-- Characteristics Panel -->
                    <div v-show="activeEntityTab.id === 'characteristics'" class="py-1">
                        <div v-for="characteristic in entity.characteristics" :key="characteristic">
                            {{ characteristic }}
                        </div>
                    </div>

                    <!-- Events Panel -->
                    <div v-show="activeEntityTab.id === 'events'" class="py-1">
                        <!-- <div v-for="event in entity.events" :key="event.id">{{ event.id }}</div> -->
                        {{ entity.events }}
                    </div>

                    <!-- Primary Measures Panel -->
                    <div v-show="activeEntityTab.id === 'primaryMeasures'" class="py-1">
                        <!-- <div v-for="primaryMeasure in entity.primaryMeasures" :key="primaryMeasure.id">{{ primaryMeasure.id }}</div> -->
                        {{ entity.primaryMeasures }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Secondary Measures -->
        <h2>Secondary Measures</h2>
        <p>Something about secondary measures...</p>
    </div>
</template>
