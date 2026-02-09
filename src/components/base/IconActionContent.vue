<script setup lang="ts">
const theme =
    'transition-[background-color] duration-150 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-500/20 dark:hover:bg-zinc-500/40 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-zinc-500 dark:group-focus-visible:outline-zinc-400';
</script>

<template>
    <div class="inline-flex items-center justify-center rounded-md p-2" :class="theme">
        <slot />
    </div>
</template>
