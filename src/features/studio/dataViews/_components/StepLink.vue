<script setup lang="ts">
// A link to one of the data view's steps, drawn as the step's circle from the task bar and a long arrow, so it reads as
// going to that step rather than opening the connection, item or store beside it. The label names what the step does,
// for screen readers and on hover, because the circle and arrow alone do not say it.

// ── External Dependencies & Registrations
import { MoveRightIcon } from '@lucide/vue';
import type { RouteLocationRaw } from 'vue-router';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { label, stepNumber, to } = defineProps<{
    label: string; // What going to the step is for, such as 'Change the connection in step 1'.
    stepNumber: number; // The step's number in the task bar.
    to: RouteLocationRaw;
}>();
</script>

<template>
    <!-- An outlined circle with the step's number, as the task bar draws a step, but always with the number, because the
         bar puts a tick in place of it once the step is done. -->
    <RouterLink
        :aria-label="label"
        class="flex flex-none items-center gap-x-1 rounded px-1 py-0.5 text-accent no-underline hover:state-hover active:state-press"
        data-region="StepLink"
        :title="label"
        :to="to"
    >
        <span aria-hidden="true" class="flex size-4 items-center justify-center rounded-full border-[1.25px] border-accent text-[0.625rem] font-semibold">
            <span class="[text-box:trim-both_cap_alphabetic]">{{ stepNumber }}</span>
        </span>
        <MoveRightIcon aria-hidden="true" class="size-4" :stroke-width="1.75" />
    </RouterLink>
</template>
