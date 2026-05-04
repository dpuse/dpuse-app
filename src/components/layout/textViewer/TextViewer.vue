<script setup lang="ts">
// Local Components - Static
import ScrollArea from '@/components/layout/scrollArea/ScrollArea.vue';

// Options, Properties, Slots & Emits
const { text, paddingBottom = '64px' } = defineProps<{ text?: string; paddingBottom?: string }>(); // 64px = 16px + 40px + 8px.
</script>

<template>
    <ScrollArea class="border-separator border-x">
        <div class="px-0.5 text-sm" :style="{ paddingBottom }">
            <pre><code ref="textViewer">{{ text }}</code></pre>
        </div>
    </ScrollArea>
</template>
