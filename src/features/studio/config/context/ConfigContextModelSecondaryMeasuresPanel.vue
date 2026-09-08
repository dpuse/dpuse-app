<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronRightIcon, SquarePenIcon } from '@lucide/vue';
import { ref, shallowRef } from 'vue';

// ── DPUse Framework
import type { Tool as MarkedTool } from '@dpuse/dpuse-tool-marked-markdown-parser';

// ── Local Framework
import type { LocalisedSecondaryMeasure } from './contextModel';
import { purifyMarkdown } from '@/services/useMarkedTool';

// ── Static Components
import BaseButton from '@/components/ui/button/BaseButton.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const SECONDARY_MEASURE_TABS = [
    { id: 'parents', label: 'Parents' },
    { id: 'characteristics', label: 'Characteristics' },
    { id: 'events', label: 'Events' },
    { id: 'primaryMeasures', label: 'Measures' }
];

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    secondaryMeasures: LocalisedSecondaryMeasure[];
    markedTool: MarkedTool | undefined;
}
const { secondaryMeasures, markedTool } = defineProps<Properties>();

defineEmits<{ edit: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeTab = shallowRef(SECONDARY_MEASURE_TABS[0]);
const expandedSecondaryMeasureId = ref<string | null>(null);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleToggleSecondaryMeasure(secondaryMeasureId: string): void {
    expandedSecondaryMeasureId.value = expandedSecondaryMeasureId.value === secondaryMeasureId ? null : secondaryMeasureId;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function purifyText(text: string): string {
    return purifyMarkdown(markedTool, text);
}
</script>

<template>
    <h2 class="flex flex-none items-center justify-between gap-x-3">Secondary Measures</h2>

    <p>The measures ... this model.</p>

    <div
        v-for="measure in secondaryMeasures"
        :key="measure.id"
        class="mt-2 max-w-prose border"
        :class="expandedSecondaryMeasureId === measure.id ? 'rounded-md border-separator' : 'rounded-md border-backdrop'"
    >
        <div
            role="button"
            tabindex="0"
            :aria-expanded="expandedSecondaryMeasureId === measure.id"
            class="flex items-center gap-x-2 bg-backdrop py-2 pr-4 pl-2"
            :class="expandedSecondaryMeasureId === measure.id ? 'rounded-t-md' : 'rounded-md'"
            @click="handleToggleSecondaryMeasure(measure.id)"
            @keydown.enter="handleToggleSecondaryMeasure(measure.id)"
            @keydown.space.prevent="handleToggleSecondaryMeasure(measure.id)"
        >
            <ChevronRightIcon class="size-5" stroke-width="1.5" />
            <div class="flex-1">{{ measure.label }}</div>
            <BaseButton @click="$emit('edit')">
                <SquarePenIcon class="size-5" stroke-width="1.5" />
            </BaseButton>
        </div>

        <div v-if="expandedSecondaryMeasureId === measure.id" class="overflow-y-hidden rounded-b-md px-4 pb-4">
            <!-- Description -->
            <div v-html="purifyText(measure.description)" />

            <!-- Secondary Measure Tabs -->
            <div class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                <template v-for="measureTab in SECONDARY_MEASURE_TABS" :key="measureTab.id">
                    <BaseButton
                        class="border-y-2 border-t-transparent py-1.25"
                        :class="measureTab.id === activeTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                        @click="activeTab = measureTab"
                    >
                        <div>{{ measureTab.label }}</div>
                    </BaseButton>
                </template>
            </div>

            <!-- Parents Panel -->
            <div v-show="activeTab.id === 'parents'" class="py-1">
                <div v-for="parent in measure.parents ?? []" :key="parent">{{ parent }}</div>
            </div>

            <!-- Characteristics Panel -->
            <div v-show="activeTab.id === 'characteristics'" class="py-1">
                <div v-for="characteristic in measure.characteristics ?? []" :key="characteristic">{{ characteristic }}</div>
            </div>

            <!-- Events Panel -->
            <div v-show="activeTab.id === 'events'" class="py-1">
                <div v-for="event in measure.events ?? []" :key="event">{{ event }}</div>
            </div>

            <!-- Primary Measures Panel -->
            <div v-show="activeTab.id === 'primaryMeasures'" class="py-1">
                <div v-for="primaryMeasure in measure.primaryMeasures ?? []" :key="primaryMeasure">{{ primaryMeasure }}</div>
            </div>
        </div>
    </div>
</template>
