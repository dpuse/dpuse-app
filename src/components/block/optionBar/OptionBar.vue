<script setup lang="ts">
// External dependencies
import type { HTMLAttributes } from 'vue';

// Components
import OptionBarContent from './OptionBarContent.vue';

// Properties
type Properties = { class?: HTMLAttributes['class']; isWideDisplay: boolean; isFloatingOpen?: boolean; sessionIsAuthenticated?: boolean };
const properties = withDefaults(defineProps<Properties>(), { isFloatingOpen: false });

// Emits
const emit = defineEmits<{ (event: 'request-close'): void }>();

// Helpers
const requestClose = () => emit('request-close');
</script>

<template>
    <div :class="properties.class">
        <OptionBarContent class="hidden w-16 flex-col pt-13.75 md:flex" :session-is-authenticated="properties.sessionIsAuthenticated" />

        <Transition name="option-bar-overlay" appear>
            <div v-if="properties.isFloatingOpen && !properties.isWideDisplay" class="option-bar-overlay fixed inset-0 z-30 flex md:hidden">
                <div class="bg-background/70 absolute inset-0 backdrop-blur-sm" @click="requestClose"></div>

                <dialog class="option-bar-panel bg-background relative mr-auto flex h-full w-16 flex-col border-0 shadow-2xl" open @cancel.prevent="requestClose">
                    <OptionBarContent class="pt-13.75" :on-option-select="requestClose" :session-is-authenticated="properties.sessionIsAuthenticated" />
                </dialog>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.option-bar-overlay-enter-active,
.option-bar-overlay-leave-active {
    transition: opacity 220ms ease;
}

.option-bar-overlay-enter-from,
.option-bar-overlay-leave-to {
    opacity: 0;
}

.option-bar-overlay-enter-active .option-bar-panel,
.option-bar-overlay-leave-active .option-bar-panel {
    transition: transform 260ms ease;
}

.option-bar-overlay-enter-from .option-bar-panel,
.option-bar-overlay-leave-to .option-bar-panel {
    transform: translateX(-100%);
}
</style>
