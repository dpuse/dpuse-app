<script setup lang="ts">
// App Core
import { useDisplayBreakpoint } from '@/composables/useDisplayBreakpoint';

// App Components - Statically imported so always available, even when offline.
import WorkbenchOptionBarContent from './WorkbenchOptionBarContent.vue';

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
        <WorkbenchOptionBarContent class="hidden md:flex" @continue="handleComplete" />

        <Transition name="horizontal-slide-ltr">
            <div v-if="isOpenInNarrowDisplay && !displayIsWide" class="fixed inset-0 z-30 flex md:hidden">
                <div class="bg-surface/70 absolute inset-0" @click="handleComplete()"></div>

                <WorkbenchOptionBarContent class="dpuse-horizontal-slide-ltr-element relative mr-auto flex shadow-lg" @continue="handleComplete" />
            </div>
        </Transition>
    </div>
</template>
