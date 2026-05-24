<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';

// Local Components - Static
import Button from '@/components/elementary/button/Button.vue';

// Local (App) Framework
import type { RouteLocationRaw } from 'vue-router';

// Options, Properties, Slots, ModelValue & Emits ──────────────────────────────────────────────────────────────────────

export type ListItemVariant = 'destructive' | 'neutral';
const {
    variant = 'neutral',
    isActive = false,
    to
} = defineProps<{
    variant?: ListItemVariant;
    isActive?: boolean;
    to?: RouteLocationRaw;
}>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const classes = computed(() => [
    'rounded-md text-[15px] leading-6 focus-visible:ring-2 dark:text-content w-full text-left min-w-0 py-1 px-2 overflow-hidden',
    variant === 'destructive'
        ? [
              'bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-900 focus-visible:ring-red-300',
              'dark:bg-red-300/10 dark:hover:bg-red-300/25 dark:active:bg-red-300/35 dark:focus-visible:ring-red-500 dark:text-red-300',
              isActive ? 'bg-red-300! dark:bg-red-400/40!' : undefined
          ]
        : [
              'bg-zinc-50 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:ring-zinc-300',
              'dark:bg-zinc-300/10 dark:hover:bg-zinc-300/25 dark:active:bg-zinc-300/35 dark:focus-visible:ring-zinc-500',
              isActive ? 'bg-blue-50! dark:bg-zinc-300/20! cursor-default! pointer-events-none!' : undefined
          ]
]);
</script>

<template>
    <Button shape="minimal" :class="classes" :to="to">
        <slot />
    </Button>
</template>
