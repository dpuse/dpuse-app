<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowLeftIcon } from '@lucide/vue';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import CloseButton from '@/components/ui/button/CloseButton.vue';

// Options, Properties, Slots & Emits
const { overline, title } = defineProps<{ overline?: string; title: string }>();
defineEmits<{ close: [] }>();
</script>

<template>
    <div class="dpuse-prose relative pt-4" data-region="StudentDocumentPanel">
        <!-- Header -->
        <Button class="group block w-full min-w-0 cursor-pointer text-left md:pointer-events-none" shape="minimal" @click="$emit('close')">
            <!-- Overline -->
            <div class="mr-9 flex min-w-0 items-center gap-x-0.5 text-sm leading-tight text-muted group-hover:text-blue-500">
                <ArrowLeftIcon class="size-4 flex-none md:hidden" />
                <span class="min-w-0 truncate">{{ overline }} </span>
            </div>

            <!-- Title -->
            <h1 class="mr-9! min-w-0 text-left wrap-break-word whitespace-normal">
                {{ title }}
            </h1>
        </Button>

        <!-- Close Button -->
        <CloseButton class="absolute top-2 right-0 hidden md:block" @click="$emit('close')" />

        <!-- Content -->
        <slot />
    </div>
</template>

<style scoped>
:deep(ul) {
    list-style: none;
    padding-left: 0;
}
</style>
