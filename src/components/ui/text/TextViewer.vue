<script setup lang="ts">
// ── External Dependencies & Registrations
import { useElementSize } from '@vueuse/core';
import { computed, useTemplateRef } from 'vue';

// ── Static Components
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type LineHighlightId = 'danger' | 'info' | 'warning';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The line takes the status colour as it is, a translucent tint. The number column also takes the page colour beneath
// the tint, because it stays put while the line scrolls sideways under it, and must hide what passes behind.
const LINE_HIGHLIGHT_CLASSES: Record<LineHighlightId, { line: string; number: string }> = {
    danger: { line: 'bg-danger', number: 'bg-linear-to-r from-danger to-danger text-danger-text' },
    info: { line: 'bg-info', number: 'bg-linear-to-r from-info to-info text-info-text' },
    warning: { line: 'bg-warning', number: 'bg-linear-to-r from-warning to-warning text-warning-text' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    lineHighlights?: ReadonlyMap<number, LineHighlightId>; // Lines to colour, by number counting from 1, e.g. where a parser found an issue.
    scrollAreaPaddingBottom?: string; // Room after the last line. More where the viewer runs to the bottom of the screen, to clear the safe area.
    text?: string;
}
const { lineHighlights, scrollAreaPaddingBottom = 'var(--vertical-scroll-bottom-embedded-inset)', text } = defineProps<Properties>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const linesElement = useTemplateRef<HTMLDivElement>('lines');
const lineNumberElements = useTemplateRef<HTMLSpanElement[]>('lineNumbers');
// The horizontal scroll bar starts where the text does, because the number column does not scroll sideways. Every
// number is as wide as the longest, so the first one is measured. Its border is included.
const { width: lineNumberColumnWidth } = useElementSize(() => lineNumberElements.value?.[0], undefined, { box: 'border-box' });

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Split at every kind of line break, so the numbers match a parser's, which counts a line inside a quoted value too. A
// break at the very end starts no line of its own, as in an editor's line count.
const lines = computed(() => {
    if (text == null || text === '') return [];
    const splitLines = text.split(/\r\n|\r|\n/u);
    if (splitLines.at(-1) === '') splitLines.pop();
    return splitLines;
});
const lineItems = computed(() =>
    lines.value.map((line, index) => {
        const lineHighlightId = lineHighlights?.get(index + 1);
        return { highlightClasses: lineHighlightId == null ? undefined : LINE_HIGHLIGHT_CLASSES[lineHighlightId], lineNumber: index + 1, text: line };
    })
);
const lineNumberWidth = computed(() => `${String(String(lines.value.length).length)}ch`); // As wide as the longest number, so every line's text starts in the same place.

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Brings a line to the middle of the view, e.g. when the user picks an issue that names it.
function scrollToLine(lineNumber: number): void {
    linesElement.value?.querySelector(`[data-line-number="${CSS.escape(String(lineNumber))}"]`)?.scrollIntoView({ block: 'center', inline: 'start' });
}

defineExpose({ scrollToLine });
</script>

<template>
    <!-- No right padding on the scroll area, so a coloured line reaches the right edge. Each line's text keeps that room
         itself instead, so the end of the longest line clears the vertical scroll bar. -->
    <ScrollArea
        data-region="TextViewer"
        :horizontal-scrollbar-inset-start="lineNumberColumnWidth"
        :scroll-area-padding-bottom="scrollAreaPaddingBottom"
        :scroll-area-padding-right="0"
    >
        <!-- Gutter Line ─ Runs the number column's dividing line to the bottom of the view, below the last line too. Held
             outside the sideways scroller, so it stays put as the numbers do. The numbers, drawn after it, cover it where
             there are lines. -->
        <template #header>
            <div
                v-if="lineItems.length > 0"
                aria-hidden="true"
                class="pointer-events-none absolute inset-y-0 left-0 border-r border-separator"
                :style="{ width: `${String(lineNumberColumnWidth)}px` }"
            />
        </template>
        <!-- Lines ─ Each line on its own row, with its number in a column that stays put while long lines scroll sideways.
             A muted line divides the numbers from the text. The numbers are hidden from screen readers and left out of a
             copy, so copied text is the file's own. An empty line keeps a line's height. -->
        <div ref="lines" class="w-max min-w-full font-mono text-sm">
            <div v-for="lineItem in lineItems" :key="lineItem.lineNumber" class="flex min-h-lh" :class="lineItem.highlightClasses?.line" :data-line-number="lineItem.lineNumber">
                <span
                    ref="lineNumbers"
                    aria-hidden="true"
                    class="sticky left-0 box-content flex-none border-r border-separator bg-surface pr-2 pl-0.5 text-right text-subtle select-none"
                    :class="lineItem.highlightClasses?.number"
                    :style="{ width: lineNumberWidth }"
                    >{{ lineItem.lineNumber }}</span
                >
                <span class="pr-page pl-2 whitespace-pre">{{ lineItem.text }}</span>
            </div>
        </div>
    </ScrollArea>
</template>
