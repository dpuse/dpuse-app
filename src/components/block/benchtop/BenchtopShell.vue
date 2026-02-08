<script setup lang="ts">
// Properties
defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isDisplayWide: boolean }>();
</script>

<template>
    <div class="bg-background-primary border-separator flex h-full flex-col" :class="isDisplayWide ? (isAssistPanelOpenInWideDisplay ? 'border-x' : 'border-l') : undefined">
        <slot />
    </div>
</template>
