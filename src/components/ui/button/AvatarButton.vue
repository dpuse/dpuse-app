<script setup lang="ts">
// Local Components - Static
import Button from './Button.vue';
</script>

<template>
    <Button
        shape="minimal"
        class="dpuse-avatar rounded-full border border-separator ring-2 ring-transparent ring-offset-0 hover:ring-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-300 active:ring-zinc-400 dark:border-zinc-400 dark:hover:ring-zinc-600 dark:focus-visible:ring-zinc-600 dark:active:ring-zinc-500 [&_img]:rounded-full"
    >
        <slot />
    </Button>
</template>
