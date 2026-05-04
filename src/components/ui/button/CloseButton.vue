<script setup lang="ts">
// External Dependencies
import { XIcon } from 'lucide-vue-next';
</script>

<template>
    <button
        class="absolute top-2 right-3 rounded-full p-1.5 transition-[background-color,transform] duration-150 hover:bg-zinc-100 focus-visible:outline-none active:scale-[0.92] active:bg-zinc-200 dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30"
        type="button"
    >
        <XIcon class="size-6.5" stroke-width="1.25" />
    </button>
</template>
