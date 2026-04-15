<script setup lang="ts">
// External Dependencies
import { onBeforeUnmount, useTemplateRef, watch } from 'vue';

// App Core
import { contentScrollTop, knowledgePaneIsVisible } from '@/state/appLayout';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const element = useTemplateRef<HTMLElement>('scroller');

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onBeforeUnmount(() => (contentScrollTop.value = 0));

watch(knowledgePaneIsVisible, (newKnowledgePanelIsVisible) => {
    contentScrollTop.value = newKnowledgePanelIsVisible ? (element.value?.scrollTop ?? 0) : 0;
});
</script>

<template>
    <div ref="scroller" class="flex-1 overflow-y-auto overscroll-y-none" @scroll.passive="contentScrollTop = ($event.target as HTMLElement).scrollTop ?? 0">
        <slot />
    </div>
</template>
