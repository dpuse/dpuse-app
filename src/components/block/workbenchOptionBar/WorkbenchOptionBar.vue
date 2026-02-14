<script setup lang="ts">
// Workbench components
import WorkbenchOptionBarContent from './WorkbenchOptionBarContent.vue';

// Properties
defineProps<{ isOpenInNarrowDisplay: boolean; isWideDisplay: boolean; sessionIsAuthenticated?: boolean }>();

// Emits
const emit = defineEmits<{ (event: 'select'): void }>();

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleSelect(): void {
    emit('select');
}
</script>

<template>
    <div class="bg-background-secondary">
        <WorkbenchOptionBarContent
            class="border-separator hidden h-full w-16 flex-col border-r md:flex"
            :on-select="handleSelect"
            :session-is-authenticated="sessionIsAuthenticated"
        />

        <Transition name="option-bar-overlay" appear>
            <div v-if="isOpenInNarrowDisplay && !isWideDisplay" class="fixed inset-0 z-30 flex md:hidden">
                <div class="bg-background-primary/70 absolute inset-0" @click="handleSelect"></div>

                <WorkbenchOptionBarContent
                    class="dpu-option-bar-panel bg-background-secondary border-separator relative mr-auto flex h-full w-16 flex-col border-r shadow-lg"
                    :on-select="handleSelect"
                    :session-is-authenticated="sessionIsAuthenticated"
                />
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
.option-bar-overlay-enter-active .dpu-option-bar-panel,
.option-bar-overlay-leave-active .dpu-option-bar-panel {
    transition: transform 260ms ease-in-out;
}
.option-bar-overlay-enter-from .dpu-option-bar-panel,
.option-bar-overlay-leave-to .dpu-option-bar-panel {
    transform: translateX(-100%);
}
</style>
