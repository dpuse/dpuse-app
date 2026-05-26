<script setup lang="ts">
// Options, Properties, Slots & Emits
const { title } = defineProps<{ title: string }>();
</script>
<template>
    <div class="border-separator mx-4 flex flex-none justify-start border-b py-4 text-lg font-light" data-region="DialogHeader">{{ title }}</div>
</template>
