<script setup lang="ts" generic="T extends RowData">
// ── External Dependencies & Registrations
import { ChevronDown } from '@lucide/vue';
import { computed, ref, useTemplateRef } from 'vue';
import type { Header, RowData } from '@tanstack/vue-table';
import { onClickOutside, useEventListener } from '@vueuse/core';

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

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// A 'computed' because the drag updates the resize state on every frame, and a header only re-renders when this changes.
const columnIsResizing = computed(() => header.column.getIsResizing());

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
    <div class="relative flex h-full items-center pr-2 select-none pointer-coarse:pr-5" data-region="TableHeaderCell">
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

        <!-- Resize Handle ─ 'touch-none' prevents scroll interference on mobile. The short line stays visible so the
             edge reads as draggable, and grows to the header's height on hover and during a drag. The wider area around
             it is invisible and only makes it easier to grab. It doubles on touch screens, where a fingertip needs
             more. -->
        <div
            v-if="header.column.getCanResize()"
            class="group/resize absolute top-0 right-0 flex h-full w-3 cursor-col-resize touch-none items-center justify-end select-none pointer-coarse:w-6"
            role="button"
            tabIndex="0"
            @mousedown.stop="header.getResizeHandler()($event)"
            @touchstart.stop.passive="header.getResizeHandler()($event)"
        >
            <div
                class="w-0.5 rounded-full transition-all"
                :class="columnIsResizing ? 'h-full bg-muted' : 'h-4 bg-subtle group-hover/resize:h-full group-hover/resize:bg-muted'"
                :data-column-id="header.column.id"
                data-region="TableResizeHandle"
            />
        </div>
    </div>
</template>
