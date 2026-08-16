<script setup lang="ts">
// Local Framework
import type { LocaleDescription, LocaleLabel, LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local Components - Static
import Button from './button/Button.vue';
import Separator from './Separator.vue';

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
    <div class="flex gap-x-2.5 overflow-x-auto overscroll-x-none border-b border-separator" data-region="TaskBar">
        <component
            :is="item.disabled ? 'div' : Button"
            v-for="item in items"
            :key="item.id"
            :aria-selected="activeTaskId === item.id"
            class="border-y-2 border-b-transparent py-2"
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
                class="flex items-center gap-x-2 text-sm"
                :class="{
                    'text-accent': activeTaskId === item.id || !item.disabled,
                    'text-subtle': item.disabled
                }"
            >
                <div
                    class="flex size-6 items-center justify-center rounded-full border-[1.5px]"
                    :class="{ 'border-blue-400 text-blue-400': activeTaskId === item.id || !item.disabled, 'border-zinc-400 text-zinc-400': item.disabled }"
                >
                    {{ item.number }}
                </div>

                <div class="flex flex-col leading-none sm:flex-row sm:gap-x-1">
                    <span>{{ item.verb }}</span>
                    <span>{{ item.label }}</span>
                </div>
            </div>
        </component>
    </div>
</template>
