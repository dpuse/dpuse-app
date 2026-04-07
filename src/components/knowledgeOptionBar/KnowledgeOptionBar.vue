<script setup lang="ts">
// App Core
import { useDisplayBreakpoint } from '@/state/useDisplayBreakpoint';

// App Components - Statically imported so always available, even after app goes offline.
import KnowledgeOptionBarContent from './KnowledgeOptionBarContent.vue';

// Properties & Emits
const { isOpenInNarrowDisplay } = defineProps<{ isOpenInNarrowDisplay: boolean }>();
const emit = defineEmits<{ (event: 'continue'): void }>();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { displayIsWide } = useDisplayBreakpoint();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleComplete(): void {
    emit('continue');
}
</script>

<template>
    <div>
        <KnowledgeOptionBarContent v-if="displayIsWide" class="flex" @continue="handleComplete" />

        <Transition appear name="horizontal-slide-rtl">
            <div v-if="isOpenInNarrowDisplay && !displayIsWide" class="fixed inset-0 z-30 flex">
                <div class="bg-surface/70 absolute inset-0" @click="handleComplete()"></div>

                <KnowledgeOptionBarContent class="dpuse-horizontal-slide-rtl-element relative ml-auto flex shadow-lg" @continue="handleComplete" />
            </div>
        </Transition>
    </div>
</template>
