<script setup lang="ts">
// Classes
const themeClasses =
    'group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-zinc-500 dark:group-focus-visible:outline-zinc-400';
</script>

<template>
    <div
        class="bg-background-primary inline-flex items-center justify-center gap-x-1 rounded-md px-3.5 py-2 text-sm inset-ring inset-ring-gray-300 hover:bg-gray-50"
        :class="themeClasses"
    >
        <slot name="icon" />
        <slot name="text" />
    </div>
</template>
