<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronRightIcon, NetworkIcon, SquarePenIcon } from '@lucide/vue';
import { ref, shallowRef } from 'vue';

// ── DPUse Framework
import type { Tool as MarkedTool } from '@dpuse/dpuse-tool-marked-markdown-parser';

// ── Local Framework
import type { LocalisedDimension } from './contextModel';
import { purifyMarkdown } from '@/services/useMarkedTool';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DIMENSION_TABS = [
    { id: 'parents', label: 'Parents' },
    { id: 'characteristics', label: 'Characteristics' },
    { id: 'events', label: 'Events' },
    { id: 'primaryMeasures', label: 'Measures' }
];

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    dimensions: LocalisedDimension[];
    markedTool: MarkedTool | undefined;
}
const { dimensions, markedTool } = defineProps<Properties>();

defineEmits<{ edit: []; showTreeDiagram: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeTab = shallowRef(DIMENSION_TABS[0]);
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

            <!-- Dimension Tabs -->
            <div class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                <template v-for="dimensionTab in DIMENSION_TABS" :key="dimensionTab.id">
                    <ActionWrapper
                        class="border-y-2 border-t-transparent py-1.25"
                        :class="dimensionTab.id === activeTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                        @click="activeTab = dimensionTab"
                    >
                        <div>{{ dimensionTab.label }}</div>
                    </ActionWrapper>
                </template>
            </div>

            <!-- Parents Panel -->
            <div v-show="activeTab.id === 'parents'" class="py-1">
                <div v-for="parent in dimension.parents ?? []" :key="parent">{{ parent }}</div>
            </div>

            <!-- Characteristics Panel -->
            <div v-show="activeTab.id === 'characteristics'" class="py-1">
                <div v-for="characteristic in dimension.characteristics ?? []" :key="characteristic">{{ characteristic }}</div>
            </div>

            <!-- Events Panel -->
            <div v-show="activeTab.id === 'events'" class="py-1">
                <div v-for="event in dimension.events ?? []" :key="event">{{ event }}</div>
            </div>

            <!-- Primary Measures Panel -->
            <div v-show="activeTab.id === 'primaryMeasures'" class="py-1">
                <div v-for="primaryMeasure in dimension.primaryMeasures ?? []" :key="primaryMeasure">{{ primaryMeasure }}</div>
            </div>
        </div>
    </div>
</template>
