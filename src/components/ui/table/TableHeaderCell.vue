<script setup lang="ts" generic="T extends RowData">
// ── External Dependencies & Registrations
import { ChevronDown } from '@lucide/vue';
import type { Header, RowData } from '@tanstack/vue-table';
import { onClickOutside, useEventListener } from '@vueuse/core';
import { ref, useTemplateRef } from 'vue';

import { t } from '@/state/locale';
import { TEXT } from './TableHeaderCell_.json';

// ── Static Components
import type { TableFeatureSet } from './tableFeatures';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    header: Header<TableFeatureSet, T>;
    isMenuHidden?: boolean; // Leaves out the column options menu, for a table whose columns must all stay as they are.
}
const { header, isMenuHidden } = defineProps<Properties>();

defineSlots<{
    detail?(): unknown; // Rendered below the column's label.
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const menuElement = useTemplateRef<HTMLDivElement>('menu');
const menuPanelElement = useTemplateRef<HTMLDivElement>('menuPanel');

const menuOpen = ref(false);
const menuPosition = ref({ right: 0, top: 0 });

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onClickOutside(
    menuPanelElement,
    () => {
        menuOpen.value = false;
    },
    { ignore: [menuElement] } // The menu's button toggles it, so a click there must not close it first.
);

// The open menu is placed once and does not follow the page, so it closes rather than drift from its column.
useEventListener(
    globalThis,
    'scroll',
    () => {
        menuOpen.value = false;
    },
    { capture: true, passive: true }
);
useEventListener(globalThis, 'resize', () => {
    menuOpen.value = false;
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleToggleMenu(): void {
    const menuBounds = menuElement.value?.getBoundingClientRect();
    if (menuBounds) menuPosition.value = { right: document.documentElement.clientWidth - menuBounds.right, top: menuBounds.bottom };
    menuOpen.value = !menuOpen.value;
}
</script>

<template>
    <div class="relative flex h-full items-center select-none" data-region="TableHeaderCell">
        <div class="flex min-w-0 flex-1 flex-col justify-center px-3">
            <span class="truncate text-sm font-medium text-muted">{{ String(header.column.columnDef.header) }}</span>
            <slot name="detail" />
        </div>

        <!-- Column options menu -->
        <div v-if="!isMenuHidden" ref="menu" class="relative flex h-full items-center">
            <button class="flex h-full items-center px-1.5 text-subtle hover:text-emphasis" @click.stop="handleToggleMenu">
                <ChevronDown class="size-3" />
            </button>

            <!-- On the page rather than in the cell, because the table's header clips anything below its own row. -->
            <Teleport to="body">
                <div
                    v-if="menuOpen"
                    ref="menuPanel"
                    class="fixed z-50 min-w-32 rounded border border-separator bg-card shadow-md"
                    :style="{ right: `${menuPosition.right}px`, top: `${menuPosition.top}px` }"
                >
                    <button
                        v-if="header.column.getIsPinned() !== 'start'"
                        class="flex w-full items-center px-3 py-1.5 text-left text-xs text-content hover:state-hover"
                        @click="
                            header.column.pin('start');
                            menuOpen = false;
                        "
                    >
                        {{ t(TEXT, 'pinLeft.label') }}
                    </button>
                    <button
                        v-if="header.column.getIsPinned() !== 'end'"
                        class="flex w-full items-center px-3 py-1.5 text-left text-xs text-content hover:state-hover"
                        @click="
                            header.column.pin('end');
                            menuOpen = false;
                        "
                    >
                        {{ t(TEXT, 'pinRight.label') }}
                    </button>
                    <button
                        v-if="header.column.getIsPinned()"
                        class="flex w-full items-center px-3 py-1.5 text-left text-xs text-content hover:state-hover"
                        @click="
                            header.column.pin(false);
                            menuOpen = false;
                        "
                    >
                        {{ t(TEXT, 'unpin.label') }}
                    </button>
                    <button
                        v-if="header.column.getCanHide()"
                        class="flex w-full items-center px-3 py-1.5 text-left text-xs text-content hover:state-hover"
                        @click="
                            header.column.toggleVisibility(false);
                            menuOpen = false;
                        "
                    >
                        {{ t(TEXT, 'hideColumn.label') }}
                    </button>
                </div>
            </Teleport>
        </div>

        <!-- Resize Handle ─ 'touch-none' prevents scroll interference on mobile -->
        <div
            v-if="header.column.getCanResize()"
            class="absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none hover:bg-zinc-300 dark:hover:bg-zinc-600"
            :class="header.column.getIsResizing() ? 'bg-zinc-400 dark:bg-zinc-500' : ''"
            role="button"
            tabIndex="0"
            @mousedown.stop="header.getResizeHandler()($event)"
            @touchstart.stop.passive="header.getResizeHandler()($event)"
        />
    </div>
</template>
