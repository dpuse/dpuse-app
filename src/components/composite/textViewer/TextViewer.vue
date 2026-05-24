<script setup lang="ts">
// Local Components - Static
import ScrollArea from '@/components/composite/scrollArea/ScrollArea.vue';

// Options, Properties, Slots & Emits
const { text } = defineProps<{ text?: string }>();
</script>

<template>
    <ScrollArea class="border-separator border-x" scroll-area-padding="embedded" scrollbar-always-visible>
        <div class="px-0.5 text-sm">
            <pre><code>{{ text }}</code></pre>
        </div>
    </ScrollArea>
</template>
