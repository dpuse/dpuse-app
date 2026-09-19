<script setup lang="ts">
// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();

defineSlots<{
    actions?(): unknown; // Rendered at the right of the heading row.
    default?(): unknown; // Rendered below the heading.
    icon?(): unknown; // Rendered before the heading, e.g. a step's state.
}>();
</script>

<template>
    <section>
        <div class="mt-6 mb-4 flex items-center justify-between gap-x-3 border-t border-separator pt-2">
            <!-- The prose heading's rule and spacing move to this row so the actions align with the title; '!' is needed
                 because the unlayered '.dpuse-prose h2' rules otherwise beat Tailwind's utilities. -->
            <div class="flex min-w-0 items-center gap-x-2">
                <slot name="icon" />
                <h2 class="m-0! border-t-0! p-0!">{{ title }}</h2>
            </div>
            <slot name="actions" />
        </div>

        <slot />
    </section>
</template>
