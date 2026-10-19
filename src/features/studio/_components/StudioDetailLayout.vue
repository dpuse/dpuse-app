<script setup lang="ts">
// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineSlots<{ default: () => unknown }>();
</script>

<template>
    <div class="flex min-h-0 flex-1 flex-col" data-region="StudioDetailLayout">
        <slot />
    </div>
</template>
