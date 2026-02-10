<script setup lang="ts">
// Properties
defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isWideDisplay: boolean }>();
</script>

<template>
    <div class="bg-background-primary border-separator flex h-full flex-col" :class="isWideDisplay ? (isAssistPanelOpenInWideDisplay ? 'border-x' : 'border-l') : undefined">
        <slot />
    </div>
</template>
