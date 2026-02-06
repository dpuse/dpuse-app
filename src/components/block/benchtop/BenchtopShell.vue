<script setup lang="ts">
// Properties
defineProps<{ isDisplayWide: boolean }>();
</script>
<template>
    <div class="bg-faint flex h-full flex-col border-b" :class="isDisplayWide ? 'rounded-b-lg border-x' : undefined">
        <slot />
    </div>
</template>
