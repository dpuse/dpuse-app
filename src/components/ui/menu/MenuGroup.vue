<script setup lang="ts">
// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { label } = defineProps<{ label: string }>();

defineSlots<{
    default(): unknown; // 'MenuItem's, or further groups.
}>();
</script>

<template>
    <!-- Group ─ The label is shown for sighted users and given to the group for screen readers, so it is not read twice. -->
    <div :aria-label="label" data-region="MenuGroup" role="group">
        <div aria-hidden="true" class="menu-group-label">{{ label }}</div>
        <slot />
    </div>
</template>
