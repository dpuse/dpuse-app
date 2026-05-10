<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = { autoHide?: string; autoHideSuspend?: boolean; rowCount?: number; scrollAreaInset?: 'embedded' | 'screen' };
const { scrollAreaInset } = defineProps<Properties>();

const emit = defineEmits<{ initialised: [scrollElement: HTMLElement] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const scrollElement = useTemplateRef<HTMLElement>('scrollElement');

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    if (scrollElement.value) emit('initialised', scrollElement.value);
});
</script>

<template>
    <div ref="scrollElement" :class="['scroll-area', scrollAreaInset]">
        <slot />
    </div>
</template>

<style scoped>
.scroll-area {
    overflow-y: auto;
    overflow-x: auto;
    min-height: 0;
    min-width: 0;
    overscroll-behavior: none;
}

.embedded {
    padding-bottom: var(--vertical-scroll-bottom-embedded-inset);
    padding-right: 16px;
}

.screen {
    padding-bottom: var(--vertical-scroll-bottom-screen-inset);
    padding-right: 16px;
}
</style>
