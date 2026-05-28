<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';

// Local (App) Framework
import type { LoadingState } from '~/src/state/loading';

// Options, Properties, Slots & Emits ─────────────────────────────────────────────────────────────────────────────────

const {
    state,
    message = 'Loading component…',
    scope = 'fixed'
} = defineProps<{
    state: LoadingState;
    message?: string;
    scope?: 'fixed' | 'absolute';
}>();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const isBlocking = computed(() => state.isBlocking.value);
const isVisible = computed(() => state.isVisible.value);
</script>

<template>
    <!-- Outer transition: no enter (transparent — appears instantly), leave keeps element in DOM so inner can finish fading -->
    <Transition name="loading-mask-outer">
        <div v-if="isBlocking" aria-hidden="true" :class="[scope === 'fixed' ? 'fixed' : 'absolute', 'inset-0']" data-region="LoadingMask">
            <Transition name="loading-mask-inner">
                <div v-if="isVisible" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/80">
                    <p class="text-sm text-muted">{{ message }}</p>
                </div>
            </Transition>
        </div>
    </Transition>
</template>

<style scoped>
/* Outer: no enter transition (transparent on arrival), leave keeps blocker alive while inner fades out */
.loading-mask-outer-leave-active {
    transition: opacity 0.25s ease;
}
.loading-mask-outer-leave-to {
    opacity: 0;
}

/* Inner: fades in when overlay becomes visible, fades out on complete or error auto-clear */
.loading-mask-inner-enter-active,
.loading-mask-inner-leave-active {
    transition: opacity 0.2s ease;
}
.loading-mask-inner-enter-from,
.loading-mask-inner-leave-to {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
    .loading-mask-outer-leave-active,
    .loading-mask-inner-enter-active,
    .loading-mask-inner-leave-active {
        transition: none;
    }
}
</style>
