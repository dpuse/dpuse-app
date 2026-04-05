<script setup lang="ts">
// External Dependencies
import { ChevronDown } from 'lucide-vue-next';
import type { Header } from '@tanstack/vue-table';
import { onBeforeUnmount, onMounted, ref } from 'vue';

// Properties & Emits
type RowData = Record<string, unknown>;
defineProps<{ header: Header<RowData, unknown> }>();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const menuOpen = ref(false);
const menuReference = ref<HTMLElement | null>(null);

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Close menu when clicking outside
function onDocumentClick(event: MouseEvent): void {
    if (menuReference.value && !menuReference.value.contains(event.target as Node)) {
        menuOpen.value = false;
    }
}
</script>

<template>
    <div class="relative flex h-full items-center select-none">
        <span class="flex-1 truncate px-3 text-xs font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {{ String(header.column.columnDef.header) }}
        </span>

        <!-- Column options menu -->
        <div ref="menuReference" class="relative flex h-full items-center">
            <button class="flex h-full items-center px-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" @click.stop="menuOpen = !menuOpen">
                <ChevronDown class="h-3 w-3" />
            </button>

            <div
                v-if="menuOpen"
                class="absolute top-full right-0 z-50 min-w-32 overflow-hidden rounded border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            >
                <button
                    v-if="header.column.getIsPinned() !== 'left'"
                    class="flex w-full items-center px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    @click="
                        header.column.pin('left');
                        menuOpen = false;
                    "
                >
                    Pin Left
                </button>
                <button
                    v-if="header.column.getIsPinned() !== 'right'"
                    class="flex w-full items-center px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    @click="
                        header.column.pin('right');
                        menuOpen = false;
                    "
                >
                    Pin Right
                </button>
                <button
                    v-if="header.column.getIsPinned()"
                    class="flex w-full items-center px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    @click="
                        header.column.pin(false);
                        menuOpen = false;
                    "
                >
                    Unpin
                </button>
                <button
                    v-if="header.column.getCanHide()"
                    class="flex w-full items-center px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    @click="
                        header.column.toggleVisibility(false);
                        menuOpen = false;
                    "
                >
                    Hide Column
                </button>
            </div>
        </div>

        <!-- Resize handle — touch-none prevents scroll interference on mobile -->
        <div
            v-if="header.column.getCanResize()"
            class="absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none hover:bg-zinc-300 dark:hover:bg-zinc-600"
            :class="header.column.getIsResizing() ? 'bg-zinc-400 dark:bg-zinc-500' : ''"
            @mousedown.stop="header.getResizeHandler()($event)"
            @touchstart.stop.passive="header.getResizeHandler()($event)"
        />
    </div>
</template>
