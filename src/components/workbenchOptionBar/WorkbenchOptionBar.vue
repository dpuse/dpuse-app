<script setup lang="ts">
// App Core
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';

// App Components
import WorkbenchOptionBarContent from './WorkbenchOptionBarContent.vue';

// Properties & Emits
type Properties = { isOpenInNarrowDisplay: boolean; displayIsWide: boolean };
const { isOpenInNarrowDisplay, displayIsWide } = defineProps<Properties>();

// Emits
const emit = defineEmits<{ (event: 'complete', config?: BenchtopOptionLocalisedConfig): void }>();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleSelect(config?: BenchtopOptionLocalisedConfig): void {
    emit('complete', config);
}
</script>

<template>
    <div>
        <WorkbenchOptionBarContent class="hidden md:flex" :on-select="handleSelect" />

        <Transition name="option-bar-overlay">
            <div v-if="isOpenInNarrowDisplay && !displayIsWide" class="fixed inset-0 z-30 flex md:hidden">
                <div class="bg-surface/70 absolute inset-0" @click="(event, config?: BenchtopOptionLocalisedConfig) => handleSelect(config)"></div>

                <WorkbenchOptionBarContent class="dpuse-floating-option-bar-panel relative mr-auto flex shadow-lg" :on-select="handleSelect" />
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.option-bar-overlay-enter-active,
.option-bar-overlay-leave-active {
    transition: opacity 220ms ease-in-out;
}
.option-bar-overlay-enter-from,
.option-bar-overlay-leave-to {
    opacity: 0;
}
.option-bar-overlay-enter-active .dpuse-floating-option-bar-panel,
.option-bar-overlay-leave-active .dpuse-floating-option-bar-panel {
    transition: transform 260ms ease-in-out;
}
.option-bar-overlay-enter-from .dpuse-floating-option-bar-panel,
.option-bar-overlay-leave-to .dpuse-floating-option-bar-panel {
    transform: translateX(-100%);
}
</style>
