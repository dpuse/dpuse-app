<script setup lang="ts" generic="T extends RowData">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import type { RowData, Table } from '@tanstack/vue-table';

// ── Static Components
import type { TableFeatureSet } from './tableFeatures';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DEFAULT_MINIMUM_COLUMN_WIDTH_PX = 20; // TanStack Table's own default, for a column that sets no 'minSize'.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { headerViewportElement, table } = defineProps<{ headerViewportElement: HTMLDivElement | null; table: Table<TableFeatureSet, T> }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// A column keeps its width until the drag ends, so this line shows where its edge will land. It lives in its own
// component because the drag updates the resize state on every frame, and only the line should re-render for that.
const linePosition = computed(() => {
    const { deltaOffset, isResizingColumn, startSize } = table.atoms.columnResizing.get();
    if (!headerViewportElement || deltaOffset === null || startSize === null || isResizingColumn === false) return;

    // The grab area is wider than the handle, so the cursor can start off to one side. The line starts on the handle instead.
    const handles = headerViewportElement.querySelectorAll<HTMLElement>('[data-region="TableResizeHandle"]');
    const handle = [...handles].find((element) => element.dataset.columnId === isResizingColumn);
    if (!handle) return;

    // The cursor can pass a column's size limits, but the column stops at them, so the line stops there too.
    const { maxSize, minSize } = table.getColumn(isResizingColumn)?.columnDef ?? {};
    const width = Math.min(Math.max(startSize + deltaOffset, minSize ?? DEFAULT_MINIMUM_COLUMN_WIDTH_PX), maxSize ?? Number.MAX_SAFE_INTEGER);

    return { left: handle.getBoundingClientRect().left - headerViewportElement.getBoundingClientRect().left + width - startSize, top: headerViewportElement.offsetTop };
});
</script>

<template>
    <div
        v-if="linePosition"
        aria-hidden="true"
        class="pointer-events-none absolute bottom-0 left-0 z-10 w-0.5 bg-subtle"
        data-region="TableResizeLine"
        :style="{ top: linePosition.top + 'px', transform: `translateX(${linePosition.left}px)` }"
    />
</template>
