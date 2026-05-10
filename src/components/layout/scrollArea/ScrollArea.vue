<script setup lang="ts">
import 'simplebar-vue/dist/simplebar.min.css';
import SimpleBar from 'simplebar-vue';
import { onMounted, ref } from 'vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = { autoHide?: string; autoHideSuspend?: boolean; rowCount?: number; scrollAreaInset?: 'embedded' | 'screen' };
const { scrollAreaInset } = defineProps<Properties>();

const emit = defineEmits<{ initialised: [scrollElement: HTMLElement] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const simplebarRef = ref<InstanceType<typeof SimpleBar> | null>(null);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    const el = (simplebarRef.value as any)?.scrollElement as HTMLElement | undefined;
    if (el) emit('initialised', el);
});

// Exposed API ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function refresh(): void {
    simplebarRef.value?.recalculate();
}

defineExpose({ refresh });
</script>

<template>
    <SimpleBar ref="simplebarRef" :class="['scroll-area', scrollAreaInset]">
        <slot />
    </SimpleBar>
</template>

<style scoped>
.scroll-area {
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
