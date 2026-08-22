<script setup lang="ts"></script>

<template>
    <div class="h-0.5 overflow-hidden bg-zinc-200 dark:bg-zinc-900" data-region="BusyBar">
        <div class="busy-bar-shimmer h-full w-1/3 bg-zinc-500 dark:bg-zinc-400" />
    </div>
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

.busy-bar-shimmer {
    animation: shimmer 1.2s ease-in-out infinite;
}
</style>
