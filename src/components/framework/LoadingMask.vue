<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── Local (App) Framework
import { viewportIsWide } from '@/state/appLayout';

// ── Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = { isDialogActive?: boolean; isModalActive?: boolean; navigationIsActive: boolean; navigationIsDelayed: boolean };
const { isDialogActive = true, isModalActive = false, navigationIsActive, navigationIsDelayed } = defineProps<Properties>();

// ── Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const maskIsActive = computed(() => isModalActive || navigationIsActive);
const maskIsDimmed = computed(() => isDialogActive || navigationIsDelayed || (isModalActive && !viewportIsWide.value));
</script>

<template>
    <!-- No enter transition — transparent blocker appears instantly. Leave fades out. -->
    <Transition name="loading-mask">
        <div
            v-if="maskIsActive"
            aria-hidden="true"
            :class="['fixed', 'inset-0', 'transition-colors', 'duration-200', 'ease-in-out', 'motion-reduce:transition-none', maskIsDimmed ? 'bg-overlay' : 'bg-transparent']"
            data-region="LoadingMask"
        >
            <div v-if="navigationIsDelayed" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/80">
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
