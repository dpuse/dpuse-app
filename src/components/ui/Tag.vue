<script setup lang="ts">
import { computed } from 'vue';

type TagColor = 'amber' | 'green' | 'other' | 'red';

const { text, color = 'other' } = defineProps<{ text: string; color?: TagColor }>();

const colorClasses = computed(() => {
    switch (color) {
        case 'amber':
            return 'bg-amber-100 text-amber-900 dark:bg-amber-300/20 dark:text-amber-300';
        case 'green':
            return 'bg-green-100 text-green-900 dark:bg-green-300/20 dark:text-green-300';
        case 'red':
            return 'bg-red-100 text-red-900 dark:bg-red-300/20 dark:text-red-300';
        default:
            return 'bg-zinc-100 text-zinc-900 dark:bg-zinc-300/20 dark:text-content';
    }
});
</script>

<template>
    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" :class="colorClasses">
        {{ text }}
    </span>
</template>
