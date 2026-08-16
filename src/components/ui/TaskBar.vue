<script setup lang="ts">
// Local Framework
import type { LocaleDescription, LocaleLabel, LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local Components - Static
import Button from './button/Button.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────
export interface TaskConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleDescription;
    disabled: boolean;
    enableUpTo: number;
    number: number;
    verb?: LocaleLabel;
}
const { activeTaskId, items = [] } = defineProps<{ activeTaskId?: string; items?: LocalisedConfig<TaskConfig>[] }>();

defineSlots<{ default(properties: { item: LocalisedConfig<TaskConfig> }): unknown }>();

defineEmits<{ select: [stepConfig: LocalisedConfig<TaskConfig>] }>();
</script>

<template>
    <div class="relative flex gap-x-0 overflow-x-auto overscroll-x-none border-b border-separator pt-2" data-region="TaskBar">
        <component
            :is="item.disabled ? 'div' : Button"
            v-for="item in items"
            :key="item.id"
            :aria-selected="activeTaskId === item.id"
            class="border-y-2 border-b-transparent pt-1.5"
            :class="{
                'border-t-blue-400': activeTaskId === item.id || !item.disabled, // TODO: Tailwind hex colors are not the same as oklch colors? Need to update logos/icons with oklch colors if we are going to standardise.
                'border-t-zinc-300 dark:border-t-zinc-500': item.disabled
            }"
            role="tab"
            shape="minimal"
            :to="!item.disabled && item.id != null ? { name: item.id, query: { ...$route.query, sView: item.id } } : undefined"
            @click="$emit('select', item)"
        >
            <div
                class="relative mb-2 pr-2 pl-1 text-sm leading-tight"
                :class="{
                    'text-accent': activeTaskId === item.id || !item.disabled,
                    'text-subtle': item.disabled
                }"
            >
                <span
                    class="absolute -top-4 left-0 flex size-4 items-center justify-center rounded-full text-xs font-semibold"
                    :class="{ 'bg-blue-400 text-white': activeTaskId === item.id || !item.disabled, 'bg-zinc-400 text-white': item.disabled }"
                    >{{ item.number }}</span
                >
                <span class="block sm:hidden">{{ item.verb }}<br />{{ item.label }}</span>
                <span class="hidden sm:block">{{ item.verb }} {{ item.label }}</span>
            </div>
        </component>
    </div>
</template>
