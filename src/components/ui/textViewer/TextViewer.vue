<script setup lang="ts">
// Local Components - Static
import ScrollArea from '@/components/layout/scrollArea/ScrollArea.vue';

// Options, Properties, Slots & Emits
const { text } = defineProps<{ text?: string }>();
</script>

<template>
    <ScrollArea class="border-separator min-h-0 border-x">
        <div class="pb-vertical-scroll-bottom-embedded-inset px-0.5 text-sm">
            <pre><code ref="textViewer">{{ text }}</code></pre>
        </div>
    </ScrollArea>
</template>
