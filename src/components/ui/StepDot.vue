<script setup lang="ts">
// ── External Dependencies & Registrations
import { CheckIcon } from '@lucide/vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Size arrives through class fallthrough, and the check scales with it.
const { state } = defineProps<{ state: 'done' | 'pending' }>();
</script>

<template>
    <!-- Hidden from screen readers: every host states the step's progress in words. Progress, not warning: done is solid
         with a check, to-do an empty outline, so the two differ by shape as well as fill and amber stays free to mean a
         warning. -->
    <span
        aria-hidden="true"
        class="flex flex-none items-center justify-center rounded-full"
        :class="state === 'done' ? 'bg-blue-500 dark:bg-blue-400' : 'inset-ring inset-ring-blue-500 dark:inset-ring-blue-300'"
    >
        <CheckIcon v-if="state === 'done'" class="size-2/3 text-white dark:text-zinc-900" :stroke-width="4" />
    </span>
</template>
