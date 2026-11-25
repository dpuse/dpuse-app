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
    isFirst?: boolean; // Marks the first column's header, whose tab starts at the table's left edge.
    isMenuHidden?: boolean; // Leaves out the column options menu, for a table whose columns must all stay as they are.
    isResizeHidden?: boolean; // Leaves out the resize handle, for a column that fills a table collapsed beside a detail panel.
    isSelected?: boolean; // Marks the tab of the column whose detail is showing.
    isTabbed?: boolean; // Draws the header as a tab, for a table whose headers also choose the column a detail panel shows.
}
const { header, isFirst, isMenuHidden, isResizeHidden, isSelected, isTabbed } = defineProps<Properties>();

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
// white on the grey header row, matching the detail panel it opens, and has no hover because it is already chosen. A
// strip of the same white covers the header's bottom line under it, so the tab joins the panel. An unselected tab turns
// a faint off-white on hover, halfway from white to the backdrop, and shows its border. It keeps the
// bottom line under it, so it lifts out of the grey row without looking selected. The first tab reaches back over the
// table's edge inset and its own gap to start at the left edge, as in VS Code. The pane's border there serves as its
// left side, so it drops its own and its rounded corner, and is padded by the same 9px so its label stays in line with
// the content below.
const tabClass = computed((): string | undefined => {
    if (!isTabbed) return;
    const shapeClass = `rounded-t-md border border-b-0 ${isFirst ? '-ml-2 rounded-tl-none border-l-0 pl-2.25' : ''}`;
    return isSelected
        ? `${shapeClass} border-separator bg-surface after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-surface`
        : `${shapeClass} border-transparent hover:border-separator hover:bg-[color-mix(in_srgb,var(--color-surface),var(--color-backdrop))] active:bg-[color-mix(in_srgb,var(--color-surface),var(--color-backdrop))] active:state-press`;
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
        <!-- Label ─ In a tab, the left padding is 5px less than a cell's, which makes up for the tab's 4px inset and 1px
             border, so the label lines up with the values below. -->
        <div class="flex min-w-0 flex-1 flex-col justify-center" :class="isTabbed ? 'pr-3 pl-1.75' : 'px-3'">
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
             A tab is inset 4px from its column's edges, and the handle is placed from inside the tab's 1px border, so
             it reaches 5px further to stay on the edge.
             A double click fits the column to its content. The handle fades in and out as a column's detail closes and
             opens. -->
        <Transition name="dpuse-action-fade">
            <div
                v-if="!isResizeHidden && header.column.getCanResize()"
                class="group/resize absolute top-0 z-1 flex h-full w-3 cursor-col-resize touch-none items-center justify-center select-none pointer-coarse:w-6"
                :class="isTabbed ? '-right-2.75 pointer-coarse:-right-4.25' : '-right-1.5 pointer-coarse:-right-3'"
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
