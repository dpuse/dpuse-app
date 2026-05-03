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
            class="border-y-4 border-b-transparent pt-1 leading-tight"
            :class="{
                'border-t-blue-400 dark:border-t-sky-500': activeStepId === item.id || !item.disabled,
                'border-t-zinc-300 dark:border-t-zinc-600': item.disabled
            }"
            :to="item.id == null || item.disabled ? undefined : { name: item.id, query: { ...$route.query, wbView: item.id } }"
            role="tab"
            @click="$emit('select', item)"
        >
            <div
                class="text-xs font-medium"
                :class="{
                    'text-blue-600 dark:text-sky-400': activeStepId === item.id || !item.disabled,
                    'text-muted': item.disabled
                }"
            >
                Step&nbsp;{{ item.number }}
            </div>
            <div
                :class="{
                    'text-zinc-800 dark:text-zinc-300': activeStepId === item.id || !item.disabled,
                    'text-zinc-500 dark:text-zinc-400': item.disabled
                }"
            >
                <span class="block text-sm sm:hidden"> {{ item.label }}</span>
                <span class="hidden text-sm sm:block">{{ item.verb }} {{ item.label }}</span>
            </div>
        </component>
    </div>
</template>
