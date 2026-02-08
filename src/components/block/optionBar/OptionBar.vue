<script setup lang="ts">
// Workbench components
import OptionBarContent from './OptionBarContent.vue';

// Properties
defineProps<{ isWideDisplay: boolean; isFloatingOpen: boolean; sessionIsAuthenticated?: boolean }>();

// Emits
const emit = defineEmits<{ (event: 'select'): void }>();

// Helpers
const handleSelect = () => emit('select');
</script>

<template>
    <div>
        <OptionBarContent class="flex w-16 flex-col pt-13.75" :on-select="handleSelect" :session-is-authenticated="sessionIsAuthenticated" />

        <!-- <Transition name="option-bar-overlay" appear>
            <div v-if="isFloatingOpen && !isWideDisplay" class="fixed inset-0 z-30 flex md:hidden">
                <div class="bg-background-primary/70 absolute inset-0" @click="handleSelect"></div>

                <div
                    class="dpu-option-bar-panel bg-background-secondary border-separator relative mr-auto flex h-full w-16 flex-col border-r shadow-xl"
                    open
                    @cancel.prevent="handleSelect"
                >
                    <OptionBarContent class="pt-13.75" :on-select="handleSelect" :session-is-authenticated="sessionIsAuthenticated" />
                </div>
            </div>
        </Transition> -->
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
.option-bar-overlay-enter-active .dpu-option-bar-panel,
.option-bar-overlay-leave-active .dpu-option-bar-panel {
    transition: transform 260ms ease-in-out;
}
.option-bar-overlay-enter-from .dpu-option-bar-panel,
.option-bar-overlay-leave-to .dpu-option-bar-panel {
    transform: translateX(-100%);
}
</style>
