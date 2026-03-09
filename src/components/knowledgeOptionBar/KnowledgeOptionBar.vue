<script setup lang="ts">
// App Components
import KnowledgeOptionBarContent from './KnowledgeOptionBarContent.vue';

// Properties & Emits
const { isOpenInNarrowDisplay, displayIsWide } = defineProps<{ isOpenInNarrowDisplay: boolean; displayIsWide: boolean }>();
const emit = defineEmits<{ (event: 'complete'): void }>();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleComplete(): void {
    emit('complete');
}
</script>

<template>
    <div>
        <KnowledgeOptionBarContent class="hidden md:flex" @click="handleComplete" />

        <Transition appear name="horizontal-slide-rtl">
            <div v-if="isOpenInNarrowDisplay && !displayIsWide" class="fixed inset-0 z-30 flex md:hidden">
                <div class="bg-surface/70 absolute inset-0" @click="handleComplete()"></div>

                <KnowledgeOptionBarContent class="dpuse-horizontal-slide-rtl-element relative ml-auto flex shadow-lg" @click="handleComplete" />
            </div>
        </Transition>
    </div>
</template>
