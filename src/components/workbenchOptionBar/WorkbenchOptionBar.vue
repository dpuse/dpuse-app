<script setup lang="ts">
// App Core
import { displayIsWide } from '@/state/displayBreakpoint';

// App Components - Statically imported so always available, even after app goes offline.
import WorkbenchOptionBarContent from './WorkbenchOptionBarContent.vue';

// Properties & Emits
const emit = defineEmits<{ (event: 'continue'): void }>();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleComplete(): void {
    emit('continue');
}
</script>

<template>
    <div>
        <WorkbenchOptionBarContent v-if="displayIsWide" class="flex" @continue="handleComplete" />

        <Transition appear name="horizontal-slide-ltr">
            <div v-if="!displayIsWide" class="fixed inset-0 z-30 flex">
                <div class="bg-surface/70 absolute inset-0" @click="handleComplete()"></div>

                <WorkbenchOptionBarContent class="dpuse-horizontal-slide-ltr-element relative mr-auto flex shadow-lg" @continue="handleComplete" />
            </div>
        </Transition>
    </div>
</template>
