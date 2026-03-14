<script setup lang="ts">
import { useNavProgress } from '@/composables/useNavProgress';

const { isNavigating } = useNavProgress();
</script>

<template>
    <Transition name="nav-progress-bar">
        <div v-if="isNavigating" class="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-blue-200 dark:bg-blue-900">
            <div class="nav-progress-bar-shimmer h-full w-1/3 bg-blue-500 dark:bg-blue-400" />
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

.nav-progress-bar-shimmer {
    animation: shimmer 1.2s ease-in-out infinite;
}

.nav-progress-bar-enter-active,
.nav-progress-bar-leave-active {
    transition: opacity 0.2s ease;
}

.nav-progress-bar-enter-from,
.nav-progress-bar-leave-to {
    opacity: 0;
}
</style>
