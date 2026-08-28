<script setup lang="ts">
// ── Static Components
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    text?: string;
}
const { text } = defineProps<Properties>();
</script>

<template>
    <ScrollArea class="border-x border-separator" data-region="TextViewer" scroll-area-padding-bottom="var(--vertical-scroll-bottom-embedded-inset)" scrollbar-always-visible>
        <div class="px-0.5 text-sm">
            <pre><code>{{ text }}</code></pre>
        </div>
    </ScrollArea>
</template>
