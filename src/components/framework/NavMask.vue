<script setup lang="ts">
import { isNavigating, isRouteChanging } from '@/state/appProgress';
</script>

<template>
    <!-- Outer transition: no enter (transparent - appears instantly), leave keeps DOM alive so inner can finish fading -->
    <Transition name="nav-mask-outer">
        <div v-if="isRouteChanging" aria-hidden="true" class="fixed inset-0" data-region="NavMask">
            <Transition name="nav-mask-inner">
                <div v-if="isNavigating" class="absolute inset-0 flex items-center justify-center bg-surface/80">
                    <p class="text-sm text-muted">Loading component…</p>
                </div>
            </Transition>
        </div>
    </Transition>
</template>

<style scoped>
/* Outer: no enter transition (transparent on arrival), leave fades to keep blocker alive during inner fade-out */
.nav-mask-outer-leave-active {
    transition: opacity 0.25s ease;
}
.nav-mask-outer-leave-to {
    opacity: 0;
}

/* Inner: fades in when progress bar shows, fades out on navigation complete */
.nav-mask-inner-enter-active,
.nav-mask-inner-leave-active {
    transition: opacity 0.2s ease;
}
.nav-mask-inner-enter-from,
.nav-mask-inner-leave-to {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
    .nav-mask-outer-leave-active,
    .nav-mask-inner-enter-active,
    .nav-mask-inner-leave-active {
        transition: none;
    }
}
</style>
