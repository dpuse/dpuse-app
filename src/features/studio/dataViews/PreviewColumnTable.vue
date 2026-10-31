<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { PreviewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './PreviewColumnTable_.json';
import { constructPreviewColumnHeaders, constructPreviewColumnRows } from './_previewColumnRows';

// ── Static Components
import ScrollRegion from '@/components/ui/scroll/ScrollRegion.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { isLabelShown, previewConfig, rowLimit } = defineProps<{
    isLabelShown?: boolean; // Shows the table's title above it. Leave it off where a heading already names the table.
    previewConfig: PreviewConfig;
    rowLimit?: number; // The first rows to show. Every row when undefined.
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const columnHeaders = computed(() => constructPreviewColumnHeaders());
const columnRows = computed(() => constructPreviewColumnRows(previewConfig));
const shownColumnRows = computed(() => (rowLimit == null ? columnRows.value : columnRows.value.slice(0, rowLimit)));
</script>

<template>
    <!-- Scrolls sideways on its own, so a wide item does not widen the document. A shown title sits above the region's frame,
         which a caption inside the table cannot, and names the table. -->
    <ScrollRegion v-slot="{ labelId }" :is-label-shown="isLabelShown" :label="t(TEXT, 'columnTable.title')">
        <table :aria-labelledby="labelId" class="text-sm whitespace-nowrap">
            <thead>
                <tr class="text-left">
                    <th class="py-1 pr-4 font-normal text-muted">{{ columnHeaders.label }}</th>
                    <th class="py-1 pr-4 font-normal text-muted">{{ columnHeaders.dataTypeLabel }}</th>
                    <th class="py-1 pr-4 font-normal text-muted">{{ columnHeaders.dataSubtypeLabel }}</th>
                    <th class="py-1 font-normal text-muted">{{ columnHeaders.matchText }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(columnRow, index) in shownColumnRows" :key="index">
                    <td class="py-1 pr-4">{{ columnRow.label }}</td>
                    <td class="py-1 pr-4">{{ columnRow.dataTypeLabel }}</td>
                    <!-- A column with no subtype is left blank on screen, and screen readers hear 'None', because a blank cell
                         alone does not say why it is empty. 'relative' keeps the hidden text inside the scroller, or iOS
                         Safari scrolls the whole page sideways. -->
                    <td v-if="columnRow.dataSubtypeLabel" class="py-1 pr-4">{{ columnRow.dataSubtypeLabel }}</td>
                    <td v-else class="relative py-1 pr-4">
                        <span class="sr-only">{{ t(TEXT, 'column.dataSubtype.none.text') }}</span>
                    </td>
                    <td class="py-1">{{ columnRow.matchText }}</td>
                </tr>
            </tbody>
        </table>
    </ScrollRegion>
</template>
