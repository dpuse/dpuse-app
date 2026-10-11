<script setup lang="ts">
// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineSlots<{ default: () => unknown }>();
</script>

<template>
    <div class="flex h-full flex-col bg-surface" data-region="StudioLayout">
        <slot />
    </div>
</template>
