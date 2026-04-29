<script setup lang="ts">
// Notes: The 'scrollbar-gutter' style setting may be important on windows machines?

// External Dependencies
import { onBeforeUnmount, useTemplateRef, watch } from 'vue';

// Local (App) Framework
import { contentScrollTop, knowledgePaneIsVisible } from '@/state/appLayout';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const scrollerElement = useTemplateRef<HTMLDivElement>('scroller');

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onBeforeUnmount(() => (contentScrollTop.value = 0));

watch(knowledgePaneIsVisible, (newKnowledgePanelIsVisible) => {
    contentScrollTop.value = newKnowledgePanelIsVisible ? (scrollerElement.value?.scrollTop ?? 0) : 0;
});
</script>

<template>
    <div
        ref="scroller"
        class="flex-1 overflow-y-auto overscroll-y-none"
        style="scrollbar-gutter: stable"
        @scroll.passive="contentScrollTop = ($event.target as HTMLElement).scrollTop ?? 0"
    >
        <slot />
    </div>
</template>
