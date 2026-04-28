<script setup lang="ts">
// External Dependencies
import { MousePointerClickIcon } from 'lucide-vue-next';

// Properties, Slots & Emits
const { message } = defineProps<{ message: string }>();
</script>

<template>
    <div class="border-boundary bg-backdrop flex h-full flex-col items-center border-l px-4 pt-[10%]">
        <div class="text-muted flex items-center gap-x-1.5">
            <MousePointerClickIcon class="size-10 flex-none" :stroke-width="0.75" />
            <div class="pt-1.5 text-[15px] leading-snug font-normal">{{ message }}</div>
        </div>
    </div>
</template>
