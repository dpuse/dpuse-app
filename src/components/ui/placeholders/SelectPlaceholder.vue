<script setup lang="ts">
// External Dependencies & Registrations
import { MousePointerClickIcon } from 'lucide-vue-next';

// Options, Properties, Slots & Emits
const { message } = defineProps<{ message: string }>();
</script>

<template>
    <div class="flex items-center gap-1.5 rounded-md bg-blue-50 p-4 leading-tight dark:bg-blue-500/10 dark:outline dark:outline-blue-500/25" data-region="SelectPlaceholder">
        <MousePointerClickIcon class="size-8 -rotate-45 text-blue-400" :stroke-width="1.5" aria-hidden="true" />
        <span class="text-sm text-accent">{{ message }}</span>
    </div>
</template>
