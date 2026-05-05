<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';

// Local Components - Static
import Button from './Button.vue';

// Local (App) Framework
import type { RouteLocationRaw } from 'vue-router';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

export type ListItemVariant = 'destructive' | 'neutral';
const { variant = 'neutral', isActive = false, to } = defineProps<{
    variant?: ListItemVariant;
    isActive?: boolean;
    to?: RouteLocationRaw;
}>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const classes = computed(() => [
    'rounded-md text-[15px] leading-6 focus-visible:ring-2 dark:text-zinc-300 w-full text-left min-w-0 py-1 px-2 overflow-hidden',
    variant === 'destructive'
        ? [
              'bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-900 focus-visible:ring-red-300',
              'dark:bg-red-400/20 dark:hover:bg-red-400/30 dark:active:bg-red-400/40 dark:focus-visible:ring-red-500',
              isActive ? 'bg-red-300! dark:bg-red-400/40!' : undefined
          ]
        : [
              'bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300',
              'dark:bg-zinc-300/10 dark:hover:bg-zinc-300/20 dark:active:bg-zinc-300/30 dark:focus-visible:ring-zinc-500',
              isActive ? 'bg-blue-50! dark:bg-blue-300/20! cursor-default! pointer-events-none!' : undefined
          ]
]);
</script>

<template>
    <Button shape="minimal" :class="classes" :to="to">
        <slot />
    </Button>
</template>
