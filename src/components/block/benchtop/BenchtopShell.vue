<script setup lang="ts">
// Properties
defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isDisplayWide: boolean }>();
</script>

<template>
    <div
        class="bg-background-primary flex h-full flex-col border-b"
        :class="isDisplayWide ? (isAssistPanelOpenInWideDisplay ? 'rounded-b-lg border-x' : 'rounded-bl-lg border-l') : undefined"
    >
        <slot />
    </div>
</template>
