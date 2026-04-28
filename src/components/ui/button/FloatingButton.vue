<script setup lang="ts">
// External Dependencies
import { ArrowBigRightIcon, PlusIcon } from 'lucide-vue-next';

const { variant = 'next' } = defineProps<{ variant?: 'add' | 'next' }>();
</script>

<template>
    <button
        class="border-separator absolute right-[calc(env(safe-area-inset-left)+16px)] bottom-4 flex h-10 w-10 items-center justify-center rounded-full border bg-slate-200 shadow-md"
    >
        <PlusIcon v-if="variant === 'add'" />
        <ArrowBigRightIcon v-else :stroke-width="1.5" />
    </button>
</template>
