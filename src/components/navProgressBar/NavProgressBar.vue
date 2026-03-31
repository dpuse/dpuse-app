<script setup lang="ts">
// App Core
import { useNavProgress } from '@/composables/useNavProgress';

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { isNavigating } = useNavProgress();
</script>

<template>
    <Transition name="dpuse-nav-progress-bar">
        <div v-if="isNavigating" class="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-zinc-200 dark:bg-zinc-900">
            <div class="dpuse-nav-progress-bar-shimmer h-full w-1/3 bg-zinc-500 dark:bg-zinc-400" />
        </div>
    </Transition>
</template>

<style scoped>
@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(400%);
    }
}

.dpuse-nav-progress-bar-shimmer {
    animation: shimmer 1.2s ease-in-out infinite;
}

.dpuse-nav-progress-bar-enter-active,
.dpuse-nav-progress-bar-leave-active {
    transition: opacity 0.2s ease;
}

.dpuse-nav-progress-bar-enter-from,
.dpuse-nav-progress-bar-leave-to {
    opacity: 0;
}
</style>
