<script setup lang="ts">
import { onMounted, ref } from 'vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = { autoHide?: string; autoHideSuspend?: boolean; rowCount?: number; scrollAreaInset?: 'embedded' | 'screen' };
const { scrollAreaInset } = defineProps<Properties>();

const emit = defineEmits<{ initialised: [scrollElement: HTMLElement] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const scrollElement = ref<HTMLElement | null>(null);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    if (scrollElement.value) emit('initialised', scrollElement.value);
});

// Exposed API ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function refresh(): void {}

defineExpose({ refresh });
</script>

<template>
    <div ref="scrollElement" :class="['scroll-area', scrollAreaInset]">
        <slot />
    </div>
</template>

<style scoped>
.scroll-area {
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    overscroll-behavior: none;
}

.embedded {
    padding-right: 16px;
    padding-bottom: var(--vertical-scroll-bottom-embedded-inset);
}

.screen {
    padding-right: 16px;
    padding-bottom: var(--vertical-scroll-bottom-screen-inset);
}
</style>
