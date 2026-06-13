<script setup lang="ts">
// External Dependencies
import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

// Props ───────────────────────────────────────────────────────────────────────

const props = defineProps(nodeViewProps);

// State ───────────────────────────────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const localTitle = ref<string>(props.node.attrs.title as string);
const localLabels = ref<string>(props.node.attrs.labels as string);
const localData = ref<string>(props.node.attrs.data as string);

// Chart ───────────────────────────────────────────────────────────────────────

function renderChart(): void {
    if (!canvasRef.value) return;

    chartInstance?.destroy();

    const parsedLabels = localLabels.value.split(',').map((s) => s.trim()).filter(Boolean);
    const parsedData = localData.value.split(',').map((s) => parseFloat(s.trim()) || 0);

    chartInstance = new Chart(canvasRef.value, {
        type: 'bar',
        data: {
            labels: parsedLabels,
            datasets: [
                {
                    label: localTitle.value,
                    data: parsedData,
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: localTitle.value },
            },
        },
    });
}

function applyChanges(): void {
    props.updateAttributes({ title: localTitle.value, labels: localLabels.value, data: localData.value });
    renderChart();
}

// Sync local state when a collaborator updates the chart externally
watch(
    () => props.node.attrs,
    (attrs) => {
        localTitle.value = attrs.title as string;
        localLabels.value = attrs.labels as string;
        localData.value = attrs.data as string;
        renderChart();
    },
    { deep: true },
);

onMounted(renderChart);
onBeforeUnmount(() => chartInstance?.destroy());
</script>

<template>
    <NodeViewWrapper class="chart-node my-4 rounded border border-separator p-4">
        <canvas ref="canvasRef" class="mb-4 max-h-64 w-full" />
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
                <button class="rounded bg-primary px-3 py-1 text-xs text-primary-foreground" @click="applyChanges">Update chart</button>
                <button class="rounded px-3 py-1 text-xs text-muted hover:text-foreground" @click="deleteNode">Remove</button>
            </div>
        </div>
    </NodeViewWrapper>
</template>
