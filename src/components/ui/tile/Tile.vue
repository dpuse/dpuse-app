<script setup lang="ts">
// Properties, Slots & Emits
const { icon, label } = defineProps<{ icon?: string; label: string; overline?: string }>();
</script>

<template>
    <div class="flex min-w-0 items-center gap-x-2 px-2">
        <div v-if="icon" class="flex-none" style="width: 22px" v-html="icon"></div>
        <div class="min-w-0 truncate">{{ label }}</div>
    </div>
</template>
