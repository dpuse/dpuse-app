<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const {
    isBlocking,
    isVisible,
    message = 'Loading…',
    scope = 'fixed',
    sustained = false,
    persistScrim = true
} = defineProps<{
    isBlocking: boolean;
    isVisible: boolean;
    message?: string;
    scope?: 'fixed' | 'absolute';
    sustained?: boolean;
    // When true (dialogs): scrim stays visible while sustained. When false (popovers): scrim only shows during loading.
    persistScrim?: boolean;
}>();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

// Scrim shows while loading always; after loading only if persistScrim is true (dialogs).
const showScrim = computed(() => sustained && (isBlocking || persistScrim));
const isInactive = computed(() => !isBlocking && !sustained);
</script>

<template>
    <Transition name="loading-mask">
        <div
            v-if="!isInactive"
            aria-hidden="true"
            :class="[scope === 'fixed' ? 'fixed' : 'absolute', 'inset-0', showScrim ? 'bg-overlay' : 'bg-transparent']"
            data-region="LoadingMask"
        >
            <Transition name="loading-mask-inner">
                <div v-if="isVisible" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/80">
                    <p class="text-sm text-muted">{{ message }}</p>
                </div>
            </Transition>
        </div>
    </Transition>
</template>

<style scoped>
.loading-mask-enter-active,
.loading-mask-leave-active,
.loading-mask-inner-enter-active,
.loading-mask-inner-leave-active {
    transition: opacity 0.2s ease;
}
.loading-mask-enter-from,
.loading-mask-leave-to,
.loading-mask-inner-enter-from,
.loading-mask-inner-leave-to {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
    .loading-mask-enter-active,
    .loading-mask-leave-active,
    .loading-mask-inner-enter-active,
    .loading-mask-inner-leave-active {
        transition: none;
    }
}
</style>
