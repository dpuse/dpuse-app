<script setup lang="ts">
// Properties, Slots & Emits
type Properties = { icon?: string; iconColor?: string; label: string; overline?: string };
const { icon, iconColor, label } = defineProps<Properties>();
</script>

<template>
    <div class="flex min-w-0 items-center gap-x-1 px-2">
        <div v-if="icon" class="shrink-0" style="height: 22px; width: 22px" v-html="icon"></div>
        <div class="min-w-0 truncate">{{ label }}</div>
    </div>
</template>
