<script setup lang="ts">
// Vendor dependencies
import { computed } from 'vue';

// Properties
const properties = defineProps<{ variant?: string }>();

// Variant themes
const theme = computed(() => {
    switch (properties.variant) {
        case 'danger':
            return 'bg-red-50 hover:bg-red-100 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-700 dark:text-red-400';
        case 'warning':
            return 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400';
        case 'success':
            return 'bg-green-50 hover:bg-green-100 dark:bg-green-500/20 dark:hover:bg-green-500/30 text-green-700 dark:text-green-400';
        default:
            return 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700';
    }
});
</script>

<template>
    <div class="inline-flex w-full items-center rounded-md px-2.5 py-1.5 text-sm" :class="theme">
        <slot />
    </div>
</template>
