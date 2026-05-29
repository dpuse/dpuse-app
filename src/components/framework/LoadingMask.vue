<script setup lang="ts">
// External Dependencies
import { computed, onUnmounted, ref, watch } from 'vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = { isBlocking: boolean; isSustained?: boolean; dimmerIsSustained?: boolean };
const { isBlocking, isSustained = false, dimmerIsSustained = true } = defineProps<Properties>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const isVisible = ref(false);
let visibilityTimer: ReturnType<typeof setTimeout> | null = null;

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const isActive = computed(() => isBlocking || isSustained);
const isDimmed = computed(() => isSustained && (isBlocking || dimmerIsSustained));

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onUnmounted(() => {
    if (visibilityTimer != null) clearTimeout(visibilityTimer);
});

watch(
    () => isBlocking,
    (isNowBlocking) => {
        if (visibilityTimer != null) {
            clearTimeout(visibilityTimer);
            visibilityTimer = null;
        }
        if (isNowBlocking) {
            visibilityTimer = setTimeout(() => {
                visibilityTimer = null;
                isVisible.value = true;
            }, 1150);
        } else {
            isVisible.value = false;
        }
    }
);
</script>

<template>
    <Transition name="loading-mask">
        <div
            v-if="isActive"
            aria-hidden="true"
            :class="['fixed', 'inset-0', 'transition-colors', 'duration-200', 'ease-in-out', 'motion-reduce:transition-none', isDimmed ? 'bg-overlay' : 'bg-transparent']"
            data-region="LoadingMask"
        >
            <div v-if="isVisible" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-200">
                <p class="text-sm text-muted">Loading…</p>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
/* No enter transition — transparent blocker appears instantly. Leave fades out. */
.loading-mask-leave-active {
    transition: opacity 0.25s ease;
}
.loading-mask-leave-to {
    opacity: 0;
}

[data-region='LoadingMask'] > div {
    animation: loading-mask-fade-in 0.2s ease;
}

@keyframes loading-mask-fade-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .loading-mask-leave-active,
    [data-region='LoadingMask'] > div {
        animation: none;
        transition: none;
    }
}
</style>
