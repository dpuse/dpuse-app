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
    isResizeHidden?: boolean; // Leaves out the resize handle, for a column that fills a table collapsed beside a detail panel.
    isSelected?: boolean; // Marks the tab of the column whose detail is showing.
    isTabbed?: boolean; // Draws the header as a tab, for a table whose headers also choose the column a detail panel shows.
}
const { header, isMenuHidden, isResizeHidden, isSelected, isTabbed } = defineProps<Properties>();

defineSlots<{
    detail?(): unknown; // Rendered below the column's label.
    label?(): unknown; // Rendered in place of the plain label, e.g. a button.
    'label-end'?(): unknown; // Rendered at the end of the label's line, which the label shortens to leave room for.
    'label-start'?(): unknown; // Rendered at the start of the label's line.
}>();

const emit = defineEmits<{ fitWidth: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const menuElement = useTemplateRef<HTMLDivElement>('menu');
const menuPanelElement = useTemplateRef<HTMLDivElement>('menuPanel');

const menuOpen = ref(false);
const menuPosition = ref({ right: 0, top: 0 });

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// A 'computed' because the drag updates the resize state on every frame, and a header only re-renders when this changes.
const columnIsResizing = computed(() => header.column.getIsResizing());

// Every tab has a border, transparent until selected, so selecting one never moves its content. The selected tab is
// white on the grey header row, matching the detail panel it opens. A strip of the same white covers the header's
// bottom line under it, so the tab joins the panel.
const tabClass = computed((): string | undefined => {
    if (!isTabbed) return;
    const shapeClass = 'rounded-t-md border border-b-0 hover:state-hover active:state-press';
    return isSelected
        ? `${shapeClass} border-separator bg-surface after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-surface`
        : `${shapeClass} border-transparent`;
});

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
    <div class="relative flex h-full items-center select-none" :class="tabClass" data-region="TableHeaderCell">
        <div class="flex min-w-0 flex-1 flex-col justify-center px-3">
            <div class="flex min-w-0 items-center">
                <slot name="label-start" />
                <slot name="label">
                    <span class="min-w-0 flex-1 truncate text-sm font-medium text-muted">{{ String(header.column.columnDef.header) }}</span>
                </slot>
                <slot name="label-end" />
            </div>
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
             edge reads as draggable, and grows to the header's height on hover and during a drag. It sits in the middle
             of a wider, invisible area that only makes it easier to grab. That area doubles on touch screens, where a
             fingertip needs more. The area is centred on the edge between two columns, so the line falls in the gap
             between their cells. 'z-1' keeps its other half above the next column's header, and below a pinned one.
             A tab is inset from its column's edges, so its handle reaches 4px further to stay on the edge.
             A double click fits the column to its content. The handle fades in and out as a column's detail closes and
             opens. -->
        <Transition name="dpuse-action-fade">
            <div
                v-if="!isResizeHidden && header.column.getCanResize()"
                class="group/resize absolute top-0 z-1 flex h-full w-3 cursor-col-resize touch-none items-center justify-center select-none pointer-coarse:w-6"
                :class="isTabbed ? '-right-2.5 pointer-coarse:-right-4' : '-right-1.5 pointer-coarse:-right-3'"
                role="button"
                tabIndex="0"
                @dblclick="emit('fitWidth')"
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
        </Transition>
    </div>
</template>
