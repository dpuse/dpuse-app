<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── Local Framework
import { viewportIsWide } from '@/state/appLayout';

// ── Options, Props, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    isDialogActive?: boolean;
    isModalActive?: boolean;
}
const { isDialogActive, isModalActive } = defineProps<Properties>();

// ── Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const maskIsActive = computed(() => isModalActive);
const maskIsDimmed = computed(() => isDialogActive || (isModalActive && !viewportIsWide.value));
</script>

<template>
    <!-- No enter transition — transparent blocker appears instantly. Leave fades out. -->
    <Transition name="loading-mask">
        <div
            v-if="maskIsActive"
            aria-hidden="true"
            :class="['fixed', 'inset-0', 'transition-colors', 'duration-200', 'ease-in-out', 'motion-reduce:transition-none', maskIsDimmed ? 'bg-overlay' : 'bg-transparent']"
            data-region="LoadingMask"
        />
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
