<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

// ── Static Components
import BaseButton from '@/components/ui/button/BaseButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

export type ListItemVariant = 'destructive' | 'neutral';
const {
    variant = 'neutral',
    isActive,
    to
} = defineProps<{
    variant?: ListItemVariant;
    isActive?: boolean;
    to?: RouteLocationRaw;
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const classes = computed(() => [
    'rounded-md text-[15px] leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring dark:text-content w-full text-left min-w-0 py-1 px-2 overflow-hidden',
    variant === 'destructive'
        ? [
              'bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
              'dark:bg-red-300/10 dark:hover:bg-red-300/25 dark:active:bg-red-300/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring dark:text-red-300',
              isActive ? 'bg-red-300! dark:bg-red-400/40!' : undefined
          ]
        : [
              'bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
              'dark:bg-zinc-300/10 dark:hover:bg-zinc-300/25 dark:active:bg-zinc-300/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
              isActive ? 'bg-blue-50! dark:bg-zinc-300/20! cursor-default! pointer-events-none!' : undefined
          ]
]);
</script>

<template>
    <BaseButton :class="classes" data-region="ListItemButton" :to="to">
        <slot />
    </BaseButton>
</template>
