<script setup lang="ts">
// External Dependencies
import type { ColumnDef } from '@tanstack/vue-table';
import { ref } from 'vue';

// Local (App) Framework
import type { DataSource } from '@/composables/useDataWindow';

// Local Components - Static
import Table from '@/components/ui/table/Table.vue';
import TransformData from './TransformData.vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const CATEGORIES = ['Alpha', 'Beta', 'Gamma', 'Delta'] as const;
const TOTAL_ROWS = 100_000;

const COLUMN_DEFINITIONS: ColumnDef<Record<string, number | string | null>>[] = [
    { accessorKey: 'id', header: 'ID', size: 120 },
    { accessorKey: 'name', header: 'Name', size: 120 },
    { accessorKey: 'category', header: 'Category', size: 120 },
    { accessorKey: 'value', header: 'Value', size: 120 }
];

const DATA_SOURCE: DataSource<{ id: number; name: string; category: string; value: string }> = {
    rowCount: TOTAL_ROWS,
    getRows(startRow: number, endRow: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(
                    Array.from({ length: endRow - startRow }, (_, index) => ({
                        id: startRow + index + 1,
                        name: `Record ${startRow + index + 1}`,
                        category: CATEGORIES[(startRow + index) % CATEGORIES.length],
                        value: ((startRow + index + 1) * 1.618).toFixed(2)
                    }))
                );
            }, 300);
        });
    }
};

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeOptionId = ref<'transform' | 'investigate'>('investigate');
</script>

<template>
    <!-- Transform Panel -->
    <TransformData v-if="activeOptionId === 'transform'" />

    <!-- Investigate Panel -->
    <Table v-if="activeOptionId === 'investigate'" class="flex-1 px-4" :column-definitions="COLUMN_DEFINITIONS" :data-source="DATA_SOURCE" />

    <!-- Option Selector -->
    <div class="justify-right fixed right-(--safe-right-offset) bottom-(--safe-bottom-offset)">
        <span class="isolate inline-flex h-10 rounded-full shadow-md">
            <!-- View mode buttons -->
            <button
                type="button"
                class="relative inline-flex items-center rounded-l-full py-2 pr-2 pl-3 text-xs text-gray-900 inset-ring-1 inset-ring-gray-300 focus:z-10"
                :class="
                    activeOptionId === 'transform'
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600'
                        : 'bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                "
                :aria-pressed="activeOptionId === 'transform'"
                @click="activeOptionId = 'transform'"
            >
                Transform
            </button>

            <button
                type="button"
                class="relative -ml-px inline-flex items-center rounded-r-full px-2 py-2 text-xs text-gray-900 inset-ring-1 inset-ring-gray-300 focus:z-10"
                :class="
                    activeOptionId === 'investigate'
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600'
                        : 'bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                "
                :aria-pressed="activeOptionId === 'investigate'"
                @click="activeOptionId = 'investigate'"
            >
                Investigate
            </button>
        </span>
    </div>
</template>
