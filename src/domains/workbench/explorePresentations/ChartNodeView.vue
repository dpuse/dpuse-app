<script setup lang="ts">
// ── External Dependencies & Registrations
import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { node, updateAttributes } = defineProps(nodeViewProps);

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const canvasReference = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;
const localTitle = ref<string>(node.attrs.title);
const localLabels = ref<string>(node.attrs.labels);
const localData = ref<string>(node.attrs.data);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(renderChart);

onBeforeUnmount(() => chartInstance?.destroy());

// Sync local state when a collaborator updates the chart externally.
watch(
    () => node.attrs,
    (attributes) => {
        localTitle.value = attributes.title as string;
        localLabels.value = attributes.labels as string;
        localData.value = attributes.data as string;
        renderChart();
    },
    { deep: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleApplyChanges(): void {
    updateAttributes({ title: localTitle.value, labels: localLabels.value, data: localData.value });
    renderChart();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function renderChart(): void {
    if (!canvasReference.value) return;

    chartInstance?.destroy();

    const parsedLabels = localLabels.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const parsedData = localData.value.split(',').map((s) => Number.parseFloat(s.trim()) || 0);

    chartInstance = new Chart(canvasReference.value, {
        type: 'bar',
        data: {
            labels: parsedLabels,
            datasets: [{ label: localTitle.value, data: parsedData, backgroundColor: 'rgba(99, 102, 241, 0.6)', borderColor: 'rgba(99, 102, 241, 1)', borderWidth: 1 }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: localTitle.value }
            }
        }
    });
}
</script>

<template>
    <NodeViewWrapper class="my-4 rounded border border-separator p-4">
        <canvas ref="canvasReference" class="mb-4 max-h-64 w-full" />

        <div class="flex flex-col gap-2 border-t border-separator pt-3">
            <label class="flex flex-col gap-1">
                <span class="text-xs text-muted">Title</span>
                <input v-model="localTitle" class="rounded border border-separator bg-transparent px-2 py-1 text-sm" placeholder="Chart title" />
            </label>

            <label class="flex flex-col gap-1">
                <span class="text-xs text-muted">Labels (comma-separated)</span>
                <input v-model="localLabels" class="rounded border border-separator bg-transparent px-2 py-1 font-mono text-sm" placeholder="Jan,Feb,Mar" />
            </label>

            <label class="flex flex-col gap-1">
                <span class="text-xs text-muted">Values (comma-separated numbers)</span>
                <input v-model="localData" class="rounded border border-separator bg-transparent px-2 py-1 font-mono text-sm" placeholder="10,20,30" />
            </label>

            <div class="flex gap-2 pt-1">
                <button class="rounded px-3 py-1 text-xs" @click="handleApplyChanges">Update chart</button>
                <button class="rounded px-3 py-1 text-xs text-muted" @click="deleteNode">Remove</button>
            </div>
        </div>
    </NodeViewWrapper>
</template>
