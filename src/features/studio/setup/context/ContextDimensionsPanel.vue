<script setup lang="ts">
// ── External Dependencies & Registrations
import { ref } from 'vue';
import { ChevronRightIcon, NetworkIcon, SquarePenIcon } from '@lucide/vue';

// ── DPUse Framework
import type { Tool as MarkedTool } from '@dpuse/dpuse-tool-marked-markdown-parser';

// ── Local Framework
import type { LocalisedDimension } from './_context';
import { purifyMarkdown } from '@/services/useMarkedTool';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { dimensions, markedTool } = defineProps<{
    dimensions: LocalisedDimension[];
    markedTool: MarkedTool | undefined;
}>();

defineEmits<{ edit: []; showTreeDiagram: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const expandedDimensionId = ref<string | null>(null);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleToggleDimension(dimensionId: string): void {
    expandedDimensionId.value = expandedDimensionId.value === dimensionId ? null : dimensionId;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function purifyText(text: string): string {
    return purifyMarkdown(markedTool, text);
}
</script>

<template>
    <h2 class="flex flex-none items-center justify-between gap-x-3">Dimensions</h2>

    <p>The dimensions ... this model.</p>

    <div
        v-for="dimension in dimensions"
        :key="dimension.id"
        class="mt-2 max-w-prose border"
        :class="expandedDimensionId === dimension.id ? 'rounded-md border-separator' : 'rounded-md border-backdrop'"
    >
        <div
            role="button"
            tabindex="0"
            :aria-expanded="expandedDimensionId === dimension.id"
            class="flex items-center gap-x-2 bg-backdrop py-2 pr-4 pl-2"
            :class="expandedDimensionId === dimension.id ? 'rounded-t-md' : 'rounded-md'"
            @click="handleToggleDimension(dimension.id)"
            @keydown.enter="handleToggleDimension(dimension.id)"
            @keydown.space.prevent="handleToggleDimension(dimension.id)"
        >
            <ChevronRightIcon class="size-5" stroke-width="1.5" />
            <div class="flex-1">{{ dimension.label }}</div>
            <ActionWrapper class="mr-1" @click="$emit('showTreeDiagram')">
                <NetworkIcon class="size-5" stroke-width="1.5" />
            </ActionWrapper>
            <ActionWrapper @click="$emit('edit')">
                <SquarePenIcon class="size-5" stroke-width="1.5" />
            </ActionWrapper>
        </div>

        <div v-if="expandedDimensionId === dimension.id" class="overflow-y-hidden rounded-b-md px-4 pb-4">
            <!-- Description -->
            <div v-html="purifyText(dimension.description)" />
        </div>
    </div>
</template>
