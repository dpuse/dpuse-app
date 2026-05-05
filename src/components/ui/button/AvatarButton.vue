<script setup lang="ts">
// Local Components
import Button from './Button.vue';
</script>

<template>
    <Button
        shape="minimal"
        class="dpuse-avatar focus-visible:ring-2 border rounded-full ring-2 ring-offset-0 ring-transparent border-separator hover:ring-zinc-300 active:ring-zinc-400 focus-visible:ring-zinc-300 dark:border-zinc-400 dark:hover:ring-zinc-600 dark:active:ring-zinc-500 dark:focus-visible:ring-zinc-600 [&_img]:rounded-full"
    >
        <slot />
    </Button>
</template>
