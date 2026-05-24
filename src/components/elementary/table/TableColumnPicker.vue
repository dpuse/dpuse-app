<script setup lang="ts" generic="T">
// External Dependencies
import { Settings2 } from 'lucide-vue-next';
import type { Table } from '@tanstack/vue-table';
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

// Options, Properties, Slots, ModelValue & Emits ──────────────────────────────────────────────────────────────────────

const { table } = defineProps<{ table: Table<T> }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const open = ref(false);
const pickerElement = useTemplateRef<HTMLDivElement>('picker');

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

function onDocumentClick(event: MouseEvent): void {
    if (pickerElement.value && !pickerElement.value.contains(event.target as Node)) {
        open.value = false;
    }
}
</script>

<template>
    <div class="flex items-center border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-700">
        <div ref="picker" class="relative">
            <button
                class="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                @click.stop="open = !open"
            >
                <Settings2 class="h-3.5 w-3.5" />
                Columns
            </button>

            <div v-if="open" class="absolute top-full left-0 z-50 min-w-48 rounded border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900">
                <label
                    v-for="col in table.getAllColumns().filter((c) => c.getCanHide())"
                    :key="col.id"
                    class="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                    <input
                        type="checkbox"
                        class="h-3.5 w-3.5 rounded accent-zinc-600 dark:accent-zinc-400"
                        :checked="col.getIsVisible()"
                        @change="col.toggleVisibility(!col.getIsVisible())"
                    />
                    <span class="text-xs text-zinc-700 dark:text-zinc-300">{{ String(col.columnDef.header) }}</span>
                </label>
            </div>
        </div>
    </div>
</template>
