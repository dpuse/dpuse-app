<script setup lang="ts">
// App Components
import KnowledgeOptionBarContent from './KnowledgeOptionBarContent.vue';

// Properties
type Properties = { isOpenInNarrowDisplay: boolean; isWideDisplay: boolean; sessionIsAuthenticated?: boolean };
const { isOpenInNarrowDisplay, isWideDisplay, sessionIsAuthenticated } = defineProps<Properties>();

// Emits
const emit = defineEmits<{ (event: 'select'): void }>();

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleSelect(): void {
    emit('select');
}
</script>

<template>
    <div>
        <KnowledgeOptionBarContent class="hidden md:flex" :on-select="handleSelect" :session-is-authenticated="sessionIsAuthenticated" />

        <Transition name="option-bar-overlay" appear>
            <div v-if="isOpenInNarrowDisplay && !isWideDisplay" class="fixed inset-0 z-30 flex md:hidden">
                <div class="bg-surface/70 absolute inset-0" @click="handleSelect"></div>

                <KnowledgeOptionBarContent
                    class="dpuse-floating-option-bar-panel relative ml-auto flex shadow-lg"
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
.option-bar-overlay-enter-active .dpuse-floating-option-bar-panel,
.option-bar-overlay-leave-active .dpuse-floating-option-bar-panel {
    transition: transform 260ms ease-in-out;
}
.option-bar-overlay-enter-from .dpuse-floating-option-bar-panel,
.option-bar-overlay-leave-to .dpuse-floating-option-bar-panel {
    transform: translateX(100%);
}
</style>
