<script setup lang="ts">
// ── External Dependencies & Registrations
import { ListXIcon } from '@lucide/vue';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
</script>

<template>
    <Button
        shape="minimal"
        class="rounded-full p-1.5 hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-300 active:scale-[92%] active:bg-zinc-200 dark:hover:bg-zinc-300/20 dark:focus-visible:ring-zinc-500 dark:active:bg-zinc-300/30"
        data-region="CloseButton"
    >
        <ListXIcon class="size-5.5" stroke-width="1.25" />
    </Button>
</template>
