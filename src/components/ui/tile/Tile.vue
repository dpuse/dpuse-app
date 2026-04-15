<script setup lang="ts">
// Properties, Emits & Slots
type Properties = { icon?: string; iconColor?: string; label: string; overline?: string };
const { icon, iconColor, label } = defineProps<Properties>();
</script>

<template>
    <div class="px-4">{{ label }}</div>
</template>
