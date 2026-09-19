<script setup lang="ts">
// ── Static Components
import StepDot from './StepDot.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { steps } = defineProps<{
    steps: { id: string; state: 'done' | 'pending' }[];
}>();
</script>

<template>
    <!-- Hidden from screen readers: the dots sit inside a control whose label already states the progress. -->
    <div aria-hidden="true" class="flex items-center gap-x-1">
        <StepDot v-for="step in steps" :key="step.id" class="size-3" :state="step.state" />
    </div>
</template>
