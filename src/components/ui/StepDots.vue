<script setup lang="ts">
// ── External Dependencies & Registrations
import { CheckIcon } from '@lucide/vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { steps } = defineProps<{
    steps: { id: string; state: 'done' | 'pending' }[];
}>();
</script>

<template>
    <!-- Hidden from screen readers: the dots sit inside a control whose label already states the progress. -->
    <div aria-hidden="true" class="flex items-center gap-x-1">
        <span
            v-for="step in steps"
            :key="step.id"
            class="flex size-3 items-center justify-center rounded-full"
            :class="step.state === 'done' ? 'bg-blue-500 dark:bg-blue-400' : 'inset-ring inset-ring-blue-500 dark:inset-ring-blue-400'"
        >
            <!-- Progress, not warning: done is solid with a check, to-do an empty outline, so the two differ by shape as well
                 as fill and amber stays free to mean a warning elsewhere on the card. -->
            <CheckIcon v-if="step.state === 'done'" class="size-2 text-white dark:text-zinc-900" :stroke-width="4" />
        </span>
    </div>
</template>
