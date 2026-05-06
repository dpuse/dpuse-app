<script setup lang="ts">
// Local (App) Framework
import type { LocaleLabel, LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import { t } from '@/state/locale';
import T from './Tasks.json';

// Options, Properties, Slots & Emits
export interface TaskConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleLabel;
    disabled: boolean;
    enableUpTo: number;
    number: number;
    verb?: LocaleLabel;
}
const { activeStepId, items = [] } = defineProps<{ activeStepId?: string; items?: LocalisedConfig<TaskConfig>[] }>();
defineSlots<{ 'default'(properties: { item: LocalisedConfig<TaskConfig> }): unknown }>();
defineEmits<{ select: [stepConfig: LocalisedConfig<TaskConfig>] }>();
</script>

<template>
    <div v-if="items" class="flex gap-x-4 overflow-x-auto overscroll-x-none text-[15px]">
        <component
            :is="item.disabled ? 'div' : Button"
            v-for="item in items"
            :key="item.id"
            :to="!item.disabled && item.id != null ? { name: item.id, query: { ...$route.query, wbView: item.id } } : undefined"
            :aria-selected="activeStepId === item.id"
            shape="minimal"
            class="border-y-2 border-b-transparent pt-1 leading-tight"
            :class="{
                'border-t-blue-500 dark:border-t-blue-400': activeStepId === item.id || !item.disabled,
                'border-t-zinc-400 dark:border-t-zinc-500': item.disabled
            }"
            role="tab"
            @click="$emit('select', item)"
        >
            <div
                class="text-xs font-medium"
                :class="{
                    'text-blue-800 dark:text-blue-300': activeStepId === item.id || !item.disabled,
                    'text-muted': item.disabled
                }"
            >
                <span class="block sm:hidden">{{ item.verb }}</span>
                <span class="hidden sm:block">{{ t(T, 'task') }}&nbsp;{{ item.number }}</span>
            </div>

            <div
                class="text-sm"
                :class="{
                    'text-zinc-800 dark:text-zinc-300': activeStepId === item.id || !item.disabled,
                    'text-zinc-500 dark:text-zinc-400': item.disabled
                }"
            >
                <span class="block sm:hidden">{{ item.label }}</span>
                <span class="hidden sm:block">{{ item.verb }} {{ item.label }}</span>
            </div>
        </component>
    </div>
</template>
