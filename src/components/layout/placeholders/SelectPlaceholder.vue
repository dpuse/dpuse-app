<script setup lang="ts">
// External Dependencies
import { MousePointerClickIcon } from 'lucide-vue-next';

// Options, Properties, Slots & Emits
const { message } = defineProps<{ message: string }>();
</script>

<template>
    <div class="flex items-center gap-1.5 rounded-md bg-blue-50 p-4 dark:bg-blue-500/10 dark:outline dark:outline-blue-500/20">
        <MousePointerClickIcon class="size-8 shrink-0 -rotate-45 text-blue-400" :stroke-width="1.5" aria-hidden="true" />
        <span class="text-sm text-blue-700 dark:text-blue-300">{{ message }}</span>
    </div>
</template>
