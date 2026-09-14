<script setup lang="ts">
// ── External Dependencies & Registrations
import { ref } from 'vue';
import { ChevronRightIcon, SquarePenIcon } from '@lucide/vue';

// ── DPUse Framework
import type { Tool as MarkedTool } from '@dpuse/dpuse-tool-marked-markdown-parser';

// ── Local Framework
import type { LocalisedSecondaryMeasure } from './contextModel';
import { purifyMarkdown } from '@/services/useMarkedTool';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    secondaryMeasures: LocalisedSecondaryMeasure[];
    markedTool: MarkedTool | undefined;
}
const { secondaryMeasures, markedTool } = defineProps<Properties>();

defineEmits<{ edit: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

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
            <ActionWrapper @click="$emit('edit')">
                <SquarePenIcon class="size-5" stroke-width="1.5" />
            </ActionWrapper>
        </div>

        <div v-if="expandedSecondaryMeasureId === measure.id" class="overflow-y-hidden rounded-b-md px-4 pb-4">
            <!-- Description -->
            <div v-html="purifyText(measure.description)" />
        </div>
    </div>
</template>
