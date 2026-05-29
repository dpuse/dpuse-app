<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';

// Local (App) Framework
import type { ReadableLoadingState } from '@/state/loading';

// Options, Properties, Slots & Emits ─────────────────────────────────────────────────────────────────────────────────

const {
    state,
    message = 'Loading component…',
    scope = 'fixed',
    sustained = false,
    persistScrim = true
} = defineProps<{
    state: ReadableLoadingState;
    message?: string;
    scope?: 'fixed' | 'absolute';
    sustained?: boolean;
    // When true (dialogs): scrim stays visible while sustained. When false (popovers): scrim only shows during loading.
    persistScrim?: boolean;
}>();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const isBlocking = computed(() => state.isBlocking.value);
const isVisible = computed(() => state.isVisible.value);

// Scrim shows while loading always; after loading only if persistScrim is true (dialogs).
const showScrim = computed(() => sustained && (isBlocking.value || persistScrim));
const isInactive = computed(() => !isBlocking.value && !sustained);
</script>

<template>
    <div
        aria-hidden="true"
        :class="[
            scope === 'fixed' ? 'fixed' : 'absolute',
            'inset-0',
            'transition-colors',
            'duration-300',
            showScrim ? 'bg-red-500' : 'bg-transparent',
            isInactive ? 'pointer-events-none' : ''
        ]"
        data-region="LoadingMask"
    >
        <Transition name="loading-mask-inner">
            <div v-if="isVisible" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-500/80">
                <p class="text-sm text-muted">{{ message }}</p>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.loading-mask-inner-enter-active,
.loading-mask-inner-leave-active {
    transition: opacity 0.2s ease;
}
.loading-mask-inner-enter-from,
.loading-mask-inner-leave-to {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
    .loading-mask-inner-enter-active,
    .loading-mask-inner-leave-active {
        transition: none;
    }
}
</style>
