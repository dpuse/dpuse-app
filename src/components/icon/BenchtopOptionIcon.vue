<script setup lang="ts">
/**
 *  Selects the correct option icon (and colors) based on the option's state and current runtime values.
 */

// Vendor dependencies.
import { computed, onBeforeUnmount, ref, watch } from 'vue';

// Workbench dependencies.
import type { BenchtopOptionState } from '@/types/workbench';

// Properties.
type Properties = { optionId: string; state: BenchtopOptionState; stateValues?: Record<string, boolean | undefined> };
const properties = defineProps<Properties>();

const stateValue = computed(() => properties.stateValues?.[properties.optionId]);
const showWaiting = ref(false);
let waitingTimer: ReturnType<typeof setTimeout> | null = null;

watch(
    stateValue,
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
    if (properties.state.kind === 'single') return properties.state.single;

    // Boolean state: pick true/false characteristics using provided runtime value (default false).
    if (properties.state.kind === 'boolean') {
        if (stateValue.value === undefined) return showWaiting.value ? waitingCharacteristics : placeholderCharacteristics;
        return stateValue.value ? properties.state.true : properties.state.false;
    }
    // Defensive fallback to avoid runtime errors if data is malformed.
    return { colors: { text: { light: '#000000' } }, icon: '' };
});

const icon = computed(() => resolvedCharacteristics.value.icon);
const textDarkColorCode = computed(() => resolvedCharacteristics.value.colors.text.dark);
const textLightColorCode = computed(() => resolvedCharacteristics.value.colors.text.light ?? '#000000');
</script>

<template>
    <Icon :text-dark-color-code="textDarkColorCode" :text-light-color-code="textLightColorCode" :icon="icon" />
</template>
