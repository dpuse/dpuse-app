<script setup lang="ts">
// Properties
type Properties = { iconSize?: 'sm' | 'md' };
const { iconSize = 'md' } = defineProps<Properties>();

// Classes
const paddingClasses = iconSize === 'sm' ? 'p-1.25' : 'p-2';
const themeClasses =
    'transition-[background-color] duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-500/40 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-zinc-500 dark:group-focus-visible:outline-zinc-400';
</script>

<template>
    <div class="inline-flex items-center justify-center rounded-md" :class="[iconSize, paddingClasses, themeClasses]">
        <slot />
    </div>
</template>

<style scoped>
div.sm :deep(svg) {
    width: 20px;
    height: 20px;
}
div.md :deep(svg) {
    width: 24px;
    height: 24px;
}
</style>
