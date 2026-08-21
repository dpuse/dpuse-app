<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import { ChevronDownIcon, RefreshCwIcon, TriangleAlertIcon } from '@lucide/vue';

// ── DPUse Framework
import { loadTool } from '@dpuse/dpuse-shared/component/module/tool';
import { AppError, type SerialisedError, serialiseError } from '@dpuse/dpuse-shared/errors';
import type { Tool as D3Tool, ErdDiagramData } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { reportAppError } from '@/observability/errorTracking';
import { toolConfigs } from '@/state/session';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '~/src/components/ui/Separator.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Evaluation example: hard-coded ERD, laid out and drawn by dpuse-tool-d3-visualiser's renderErdDiagram (dagre + d3-selection).
const ERD_DATA: ErdDiagramData = {
    nodes: [
        { id: 'organisation', label: 'Organisation', typeId: 'external' },
        { id: 'organisationalUnit', label: 'Organisational Unit', typeId: 'external' },
        { id: 'job', label: 'Job', typeId: 'optional' },
        { id: 'position', label: 'Position', typeId: 'local' },
        { id: 'person', label: 'Person', typeId: 'external' },
        { id: 'engagement', label: 'Engagement', typeId: 'local' },
        { id: 'contract', label: 'Contract', typeId: 'optional' },
        { id: 'occupancy', label: 'Occupancy', typeId: 'local' },
        { id: 'language', label: 'Language', typeId: 'external' },
        { id: 'nationality', label: 'Nationality', typeId: 'external' }
    ],
    edges: [
        { source: 'organisation', target: 'organisationalUnit' },
        { source: 'organisation', target: 'job' },
        { source: 'organisation', target: 'engagement' },
        { source: 'organisationalUnit', target: 'organisationalUnit' },
        { source: 'person', target: 'engagement' },
        { source: 'person', target: 'language' },
        { source: 'person', target: 'nationality' },
        { source: 'job', target: 'position' },
        { source: 'engagement', target: 'contract' },
        { source: 'contract', target: 'occupancy' },
        { source: 'position', target: 'occupancy' }
    ]
};

// Order constraints lay the rank out as: [organisation's own children] [engagement, shared] [person's own children],
// so neither parent's edge into 'engagement' has to cross back through the other parent's cluster.
const ORDER_CONSTRAINTS = [
    { left: 'organisation', right: 'person' },
    { left: 'organisationalUnit', right: 'job' },
    { left: 'job', right: 'engagement' },
    { left: 'engagement', right: 'language' },
    { left: 'language', right: 'nationality' },
    { left: 'position', right: 'occupancy' }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const container = useTemplateRef<HTMLDivElement>('container');
const renderErrorChain = ref<SerialisedError[] | undefined>(undefined);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const mainError = computed(() => renderErrorChain.value?.[0]);
const rootCause = computed(() => (renderErrorChain.value != null && renderErrorChain.value.length > 1 ? renderErrorChain.value.at(-1) : undefined));
const errorTrace = computed(() => renderErrorChain.value ?? []);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    void renderDiagram();
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetry(): void {
    void renderDiagram();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function renderDiagram(): Promise<void> {
    renderErrorChain.value = undefined;
    try {
        const d3Tool = await loadTool<D3Tool>(toolConfigs.value, 'd3-visualiserr');
        if (container.value) {
            await d3Tool.renderErdDiagram(ERD_DATA, container.value, { orderConstraints: ORDER_CONSTRAINTS });
        }
    } catch (error) {
        const appError = new AppError(
            'Failed to render ERD diagram',
            'dpuse.contextErdDiagramPanel.renderDiagram',
            { typeId: 'handled' },
            { cause: new Error('Test', { cause: error }) }
        );
        renderErrorChain.value = serialiseError(appError);
        reportAppError(appError);
    }
}
</script>

<template>
    <ScrollArea class="min-h-0 flex-1">
        <div v-if="renderErrorChain" class="mx-auto mt-8 w-[calc(100%-2rem)] max-w-sm rounded-lg border border-warning-ring/20 bg-warning px-4 py-5">
            <TriangleAlertIcon class="size-8 text-warning-text" />

            <p class="mt-2 text-sm font-semibold text-warning-text">{{ mainError?.message }}</p>

            <p v-if="rootCause" class="mt-2 text-sm text-warning-text/80"><span class="text-sm font-semibold">Cause</span>: {{ rootCause.message }}</p>

            <details v-if="errorTrace.length > 0" class="group my-3 text-left">
                <summary class="flex w-fit cursor-pointer list-none items-center gap-1 text-sm font-semibold text-warning-text/80 [&::-webkit-details-marker]:hidden">
                    Trace
                    <ChevronDownIcon class="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <!-- TODO: Need to wrap trace content in scroller. -->
                <ul class="pl-4!">
                    <li v-for="(traceError, index) in errorTrace" :key="index" class="text-sm leading-snug! text-warning-text/70">
                        {{ traceError.message }}
                        <span class="text-warning-text/50">({{ traceError.name }})</span>
                    </li>
                </ul>
            </details>

            <Button class="mt-3 ml-auto flex items-center inset-ring inset-ring-warning-ring/20" variant="guarded" @click="handleRetry">
                <RefreshCwIcon class="mr-1.5 size-4" />
                Retry
            </Button>

            <p class="mb-0! border-t border-warning-ring/20 pt-2 text-xs leading-snug! text-warning-text/60">
                See the browser console for more details. This error has been logged with DPUse Support for investigation.
            </p>
        </div>

        <div v-show="!renderErrorChain" ref="container" class="p-6" />
    </ScrollArea>
</template>
