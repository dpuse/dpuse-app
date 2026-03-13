<script setup lang="ts">
// App Core
import { useDisplayBreakpoint } from '@/composables/useDisplayBreakpoint';

// App Components
import KnowledgeOptionBarContent from './KnowledgeOptionBarContent.vue';

// Properties & Emits
const { isOpenInNarrowDisplay } = defineProps<{ isOpenInNarrowDisplay: boolean }>();

const { displayIsWide } = useDisplayBreakpoint();
const emit = defineEmits<{ (event: 'continue'): void }>();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleComplete(): void {
    emit('continue');
}
</script>

<template>
    <div>
        <KnowledgeOptionBarContent class="hidden md:flex" @continue="handleComplete" />

        <Transition appear name="horizontal-slide-rtl">
            <div v-if="isOpenInNarrowDisplay && !displayIsWide" class="fixed inset-0 z-30 flex md:hidden">
                <div class="bg-surface/70 absolute inset-0" @click="handleComplete()"></div>

                <KnowledgeOptionBarContent class="dpuse-horizontal-slide-rtl-element relative ml-auto flex shadow-lg" @continue="handleComplete" />
            </div>
        </Transition>
    </div>
</template>
