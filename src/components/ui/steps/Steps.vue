<script setup lang="ts">
// Local (App) Framework
import type { LocaleLabel, LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Properties, Slots & Emits
export interface StepConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleLabel;
    disabled: boolean;
    enableUpTo: number;
    number: number;
    verb?: LocaleLabel;
}
const { activeStepId, items = [] } = defineProps<{ activeStepId?: string; items?: LocalisedConfig<StepConfig>[] }>();
defineSlots<{ 'default'(properties: { item: LocalisedConfig<StepConfig> }): unknown }>();
defineEmits<{ select: [stepConfig: LocalisedConfig<StepConfig>] }>();
</script>

<template>
    <div v-if="items" class="flex gap-x-4 overflow-x-auto overscroll-x-none text-[15px]">
        <component
            :is="item.id != null && !item.disabled ? 'RouterLink' : 'div'"
            v-for="item in items"
            :key="item.id"
            :aria-selected="activeStepId === item.id"
            class="border-y-2 border-t-transparent pb-1 leading-tight"
            :class="{
                'border-b-blue-500': activeStepId === item.id,
                'border-b-zinc-500': activeStepId !== item.id && !item.disabled,
                'border-b-zinc-200': activeStepId !== item.id && item.disabled
            }"
            :to="item.id == null || item.disabled ? undefined : { name: item.id, query: { ...$route.query, wbView: item.id } }"
            role="tab"
            @click="$emit('select', item)"
        >
            <slot :item="item" />
        </component>
    </div>
</template>
