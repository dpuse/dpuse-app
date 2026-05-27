<script setup lang="ts">
import { isNavigating, isRouteChanging } from '@/state/appProgress';
</script>

<template>
    <div v-if="isRouteChanging" aria-hidden="true" class="fixed inset-0" data-region="NavMask">
        <Transition name="nav-mask">
            <div v-if="isNavigating" class="absolute inset-0 flex items-center justify-center bg-surface/80">
                <p class="text-sm text-muted">Loading component…</p>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.nav-mask-enter-active,
.nav-mask-leave-active {
    transition: opacity 0.2s ease;
}
.nav-mask-enter-from,
.nav-mask-leave-to {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
    .nav-mask-enter-active,
    .nav-mask-leave-active {
        transition: none;
    }
}
</style>
