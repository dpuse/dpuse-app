<script setup lang="ts">
// App Core
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';

// App Components
import WorkbenchOptionBarContent from './WorkbenchOptionBarContent.vue';

// Properties & Emits
const { isOpenInNarrowDisplay, displayIsWide } = defineProps<{ isOpenInNarrowDisplay: boolean; displayIsWide: boolean }>();
const emit = defineEmits<{ (event: 'complete', config?: BenchtopOptionLocalisedConfig): void }>();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleComplete(config?: BenchtopOptionLocalisedConfig): void {
    emit('complete', config);
}
</script>

<template>
    <div>
        <WorkbenchOptionBarContent class="hidden md:flex" @complete="handleComplete" />

        <Transition name="horizontal-slide-ltr">
            <div v-if="isOpenInNarrowDisplay && !displayIsWide" class="fixed inset-0 z-30 flex md:hidden">
                <div class="bg-surface/70 absolute inset-0" @click="handleComplete()"></div>

                <WorkbenchOptionBarContent class="dpuse-horizontal-slide-ltr-element relative mr-auto flex shadow-lg" @complete="handleComplete" />
            </div>
        </Transition>
    </div>
</template>
