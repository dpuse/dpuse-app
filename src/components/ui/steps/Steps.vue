<script setup lang="ts">
// Local Framework
import type { StepConfig } from '@/composables/useSteps';

type StepSlotConfig = StepConfig & { label?: unknown; number?: unknown };

// Properties, Slots & Emits
const { activeStepId, items = [] } = defineProps<{ activeStepId?: string; items?: StepConfig[] }>();
defineSlots<{ 'default'(properties: { item: StepSlotConfig }): unknown }>();
defineEmits<{ select: [step: StepConfig] }>();
</script>

<template>
    <div v-if="items" class="flex gap-x-3 overflow-x-auto overscroll-x-none text-[15px]">
        <component
            :is="item.to != null && !item.disabled ? 'RouterLink' : 'div'"
            v-for="item in items"
            :key="item.id"
            :aria-selected="activeStepId === item.id"
            class="border-y-2 border-t-transparent px-2 pb-1 leading-tight"
            :class="{
                'border-b-blue-500': activeStepId === item.id,
                'border-b-zinc-500': activeStepId !== item.id && !item.disabled,
                'border-b-zinc-200': activeStepId !== item.id && item.disabled
            }"
            :to="item.to == null || item.disabled ? undefined : { name: item.to, query: { ...$route.query, wbView: item.to } }"
            role="tab"
            @click="$emit('select', item)"
        >
            <slot :item="item" />
        </component>
    </div>
</template>
