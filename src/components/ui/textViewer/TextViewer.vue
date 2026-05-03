<script setup lang="ts">
// Local Components - Static
import ScrollArea from '@/components/ui/scrollArea/ScrollArea.vue';

// Properties, Slots & Emits
const { text } = defineProps<{ text?: string }>();
</script>

<template>
    <ScrollArea class="border-separator min-h-0 border-x">
        <div class="px-0.5 pb-[calc(12px+40px+8px)] text-sm">
            <pre><code ref="textViewer">{{ text }}</code></pre>
        </div>
    </ScrollArea>
</template>
