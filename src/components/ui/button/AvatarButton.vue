<script setup lang="ts">
// ── Static Components
import Button from '@/components/ui/button/Button.vue';
</script>

<template>
    <Button
        shape="minimal"
        class="rounded-full border border-separator ring-2 ring-transparent ring-offset-0 hover:ring-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:ring-zinc-400 dark:border-zinc-400 dark:hover:ring-zinc-600 dark:active:ring-zinc-500 [&_img]:rounded-full"
        data-region="AvatarButton"
    >
        <slot />
    </Button>
</template>
