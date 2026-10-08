<script setup lang="ts">
// ── Static Components
import StepDot from './StepDot.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { steps } = defineProps<{
    steps: { id: string; state: 'done' | 'pending' }[];
}>();
</script>

<template>
    <!-- Hidden from screen readers: the host states the progress in words, e.g. in its open button's description.
         Small enough to sit on a line of small text, where a check would not read, so done is shown by the fill alone. -->
    <div aria-hidden="true" class="flex flex-none items-center gap-x-0.75">
        <StepDot v-for="step in steps" :key="step.id" class="size-1.5 [&>svg]:hidden" :state="step.state" />
    </div>
</template>
