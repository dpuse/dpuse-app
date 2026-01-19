<script setup lang="ts">
/**
 * Renders a raw SVG string with light and optional dark text colors.
 */

import { computed } from 'vue';

type Properties = { textDarkColorCode?: string; textLightColorCode?: string; icon: string };
const { icon, textDarkColorCode = '', textLightColorCode = '#000000' } = defineProps<Properties>();

const colorStyles = computed(() => [
    { color: textLightColorCode },
    textDarkColorCode && {
        '@media (prefers-color-scheme: dark)': { color: textDarkColorCode }
    }
]);
</script>

<template>
    <div v-if="icon" aria-hidden="true" :style="colorStyles" v-html="icon" />
</template>
