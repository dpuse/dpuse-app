<script setup lang="ts">
// Local Components - Static
import ScrollArea from './ScrollArea.vue';

// Options, Properties, Slots & Emits
const { text } = defineProps<{ text?: string }>();
</script>

<template>
    <ScrollArea class="border-separator border-x" data-region="TextViewer" scroll-area-padding="embedded" scrollbar-always-visible>
        <div class="px-0.5 text-sm">
            <pre><code>{{ text }}</code></pre>
        </div>
    </ScrollArea>
</template>
