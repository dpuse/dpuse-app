<script setup lang="ts">
// Properties
defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isDisplayWide: boolean }>();
</script>
<template>
    <div class="bg-faint flex h-full flex-col border-b" :class="isDisplayWide ? (isAssistPanelOpenInWideDisplay ? 'rounded-b-lg border-x' : 'rounded-l-lg border-l') : undefined">
        <slot />
    </div>
</template>
