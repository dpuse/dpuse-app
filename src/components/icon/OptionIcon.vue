<script setup lang="ts">
// Selects the correct option icon (and colors) based on the option's state and current runtime values.

// External dependencies
import { computed, onBeforeUnmount, ref, watch } from 'vue';

// Core
import type { BenchtopOptionKind } from '@/types/workbench';

// Properties
type Properties = { optionId: string; kind: BenchtopOptionKind; optionKindValues?: Record<string, boolean | undefined> };
const properties = defineProps<Properties>();

const kindValue = computed(() => properties.optionKindValues?.[properties.optionId]);
const showWaiting = ref(false);
let waitingTimer: ReturnType<typeof setTimeout> | null = null;

watch(
    kindValue,
    (value) => {
        if (value === undefined) {
            if (waitingTimer != null) return;
            waitingTimer = setTimeout(() => {
                showWaiting.value = true;
                waitingTimer = null;
            }, 350);
        } else {
            if (waitingTimer != null) {
                clearTimeout(waitingTimer);
                waitingTimer = null;
            }
            showWaiting.value = false;
        }
    },
    { immediate: true }
);

// Lifecycle event handlers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onBeforeUnmount(() => {
    if (waitingTimer != null) clearTimeout(waitingTimer);
});

// Fallback characteristics used while waiting for a boolean state value to resolve.
const waitingIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">' +
    '<circle cx="12" cy="12" r="9" stroke-opacity="0.3" />' +
    '<path d="M12 3a9 9 0 0 1 9 9" >' +
    '<animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />' +
    '</path>' +
    '</svg>';
const waitingCharacteristics = { colors: { text: { light: '#9ca3af', dark: '#4b5563' } }, icon: waitingIcon };

// Placeholder characteristics to reserve space before showing waiting/real icons.
const placeholderIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"></svg>';
const placeholderCharacteristics = { colors: { text: { light: 'transparent', dark: 'transparent' } }, icon: placeholderIcon };

// Benchtop icon characteristics state.
const resolvedCharacteristics = computed(() => {
    // Single state: assign fixed characteristics.
    if (properties.kind.id === 'single') return properties.kind.single;
    if (properties.kind.id === 'multiple') return properties.kind.multiple;

    // Boolean state: pick true/false characteristics using provided runtime value (default false).
    if (properties.kind.id === 'boolean') {
        if (kindValue.value === undefined) return showWaiting.value ? waitingCharacteristics : placeholderCharacteristics;
        return kindValue.value ? properties.kind.true : properties.kind.false;
    }
    // Defensive fallback to avoid runtime errors if data is malformed.
    return { colors: { text: { light: '#000000' } }, icon: '' };
});

const icon = computed(() => resolvedCharacteristics.value.icon);
const textDarkColorCode = computed(() => resolvedCharacteristics.value.colors.text.dark);
const textLightColorCode = computed(() => resolvedCharacteristics.value.colors.text.light ?? '#000000');

const colorStyles = computed(() => [
    { color: textLightColorCode.value },
    textDarkColorCode.value && {
        '@media (prefers-color-scheme: dark)': { color: textDarkColorCode.value }
    }
]);
</script>

<template>
    <div v-if="icon" aria-hidden="true" class="dpu-icon" :style="colorStyles" v-html="icon" />
</template>

<style scoped>
.dpu-icon :deep(svg) {
    display: block;
    height: 100%;
    width: 100%;
}
</style>
