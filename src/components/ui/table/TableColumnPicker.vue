<script setup lang="ts" generic="T extends RowData">
// ── External Dependencies & Registrations
import { Settings2 } from '@lucide/vue';
import type { RowData, Table } from '@tanstack/vue-table';
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

// ── Local Components - Static
import type { TableFeatureSet } from './tableFeatures';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { table } = defineProps<{ table: Table<TableFeatureSet, T> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const open = ref(false);
const pickerElement = useTemplateRef<HTMLDivElement>('picker');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => document.addEventListener('click', onDocumentClick));

onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function onDocumentClick(event: MouseEvent): void {
    if (pickerElement.value && !pickerElement.value.contains(event.target as Node)) {
        open.value = false;
    }
}
</script>

<template>
    <div class="flex items-center border-b border-separator px-3 py-1.5" data-region="TableColumnPicker">
        <div ref="picker" class="relative">
            <button class="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted hover:bg-card-hover" @click.stop="open = !open">
                <Settings2 class="size-3.5" />
                Columns
            </button>

            <div v-if="open" class="absolute top-full left-0 z-50 min-w-48 rounded border border-separator bg-card shadow-md">
                <label
                    v-for="col in table.getAllColumns().filter((c) => c.getCanHide())"
                    :key="col.id"
                    class="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-card-hover"
                >
                    <input
                        type="checkbox"
                        class="size-3.5 rounded accent-zinc-600 dark:accent-zinc-400"
                        :checked="col.getIsVisible()"
                        @change="col.toggleVisibility(!col.getIsVisible())"
                    />
                    <span class="text-xs text-content">{{ String(col.columnDef.header) }}</span>
                </label>
            </div>
        </div>
    </div>
</template>
