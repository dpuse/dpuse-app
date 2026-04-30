<script setup lang="ts">
// External Dependencies
import 'overlayscrollbars/overlayscrollbars.css';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';

// Properties, Slots & Emits
const { text } = defineProps<{ text?: string }>();
</script>

<template>
    <OverlayScrollbarsComponent class="border-separator min-h-0 flex-1 overscroll-none border-x pb-16" defer :options="{ scrollbars: { autoHide: 'leave' } }">
        <div class="px-0.5 text-sm">
            <pre><code ref="textViewer">{{ text }}</code></pre>
        </div>
    </OverlayScrollbarsComponent>
</template>
