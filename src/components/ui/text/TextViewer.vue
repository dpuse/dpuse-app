<script setup lang="ts">
// ── Static Components
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    scrollAreaPaddingBottom?: string; // Room after the last line. More where the viewer runs to the bottom of the screen, to clear the safe area.
    text?: string;
}
const { scrollAreaPaddingBottom = 'var(--vertical-scroll-bottom-embedded-inset)', text } = defineProps<Properties>();
</script>

<template>
    <ScrollArea data-region="TextViewer" :scroll-area-padding-bottom="scrollAreaPaddingBottom">
        <div class="px-0.5 text-sm">
            <pre><code>{{ text }}</code></pre>
        </div>
    </ScrollArea>
</template>
