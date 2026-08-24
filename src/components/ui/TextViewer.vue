<script setup lang="ts">
// Local Components - Static
import ScrollArea from '@/components/ui/ScrollArea.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { text } = defineProps<{ text?: string }>();
</script>

<template>
    <ScrollArea class="border-x border-separator" data-region="TextViewer" scroll-area-padding-bottom="var(--vertical-scroll-bottom-embedded-inset)" scrollbar-always-visible>
        <div class="px-0.5 text-sm">
            <pre><code>{{ text }}</code></pre>
        </div>
    </ScrollArea>
</template>
