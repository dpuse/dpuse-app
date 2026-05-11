<script setup lang="ts">
// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Tab = { id: string; label: string };

const { tabs, modelValue } = defineProps<{ tabs: Tab[]; modelValue: string }>();

defineSlots<{ action(): unknown }>();

const emit = defineEmits<{ 'update:modelValue': [id: string]; action: [] }>();
</script>

<template>
    <div class="absolute bottom-[calc(var(--safe-bottom-offset))] left-1/2 -translate-x-1/2">
        <span class="isolate inline-flex h-10 rounded-full shadow-md">
            <!-- Tab buttons -->
            <button
                v-for="(tab, index) in tabs"
                :key="tab.id"
                type="button"
                class="relative inline-flex items-center py-2 text-xs text-gray-900 inset-ring-1 inset-ring-gray-300 focus:z-10"
                :class="[
                    index === 0 ? 'rounded-l-full pr-2 pl-3' : '-ml-px px-2',
                    modelValue === tab.id
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600'
                        : 'bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                ]"
                :aria-pressed="modelValue === tab.id"
                @click="emit('update:modelValue', tab.id)"
            >
                {{ tab.label }}
            </button>

            <!-- Divider -->
            <span class="relative z-10 -ml-px inline-flex w-px self-stretch bg-blue-400 dark:bg-blue-500" aria-hidden="true"></span>

            <!-- Action button (accent cap) -->
            <button
                type="button"
                class="relative -ml-px inline-flex items-center gap-x-1 rounded-r-full border border-blue-400 bg-blue-50 py-2 pr-3 pl-2.5 text-xs text-blue-600 hover:bg-blue-100 focus:z-10 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
                @click="emit('action')"
            >
                <slot name="action" />
            </button>
        </span>
    </div>
</template>
