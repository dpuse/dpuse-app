<script setup lang="ts">
// External dependencies
import { useColorMode, useMediaQuery } from '@vueuse/core';
import { computed, onMounted, ref, watch } from 'vue';

// Application modules
import { useSessionStore } from '@/stores/sessionStore';

// Components and icons
import AssistantPanel from '@/components/blocks/assistant/AssistantPanel.vue';
import BenchtopOptionBar from '@/components/blocks/optionBar/OptionBar.vue';
import DPULogoIcon from '@/components/icon/logo/DPULogoIcon.vue';
import Button from '@/components/primitives/button/Button.vue';
import { Sparkles } from 'lucide-vue-next';
import StatusBar from '@/components/blocks/statusBar/StatusBar.vue';

// Global state
useColorMode();

// Lifecycle event handlers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(() => useSessionStore().initServices()); // Initialize session services (authentication, messenger) after the app component mounts

// Display width state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const isDisplayWide = useMediaQuery('(min-width: 768px)');
watch(isDisplayWide, (newIsDisplayWide) => {
    if (newIsDisplayWide) isAssistPanelOpenInNarrowDisplay.value = false;
});

// Assistant panel state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const assistToggleAriaLabel = computed(() => {
    const isPanelVisible = isDisplayWide.value ? isAssistPanelOpenInWideDisplay.value : isAssistPanelOpenInNarrowDisplay.value;
    return isPanelVisible ? 'Hide assistant panel' : 'Show assistant panel';
});
const isAssistPanelOpenInWideDisplay = ref(true);
const isAssistPanelOpenInNarrowDisplay = ref(false);

function toggleAssistPanel() {
    if (isDisplayWide.value) {
        isAssistPanelOpenInWideDisplay.value = !isAssistPanelOpenInWideDisplay.value;
        return;
    }
    isAssistPanelOpenInNarrowDisplay.value = !isAssistPanelOpenInNarrowDisplay.value;
}
</script>

<template>
    <!-- Workbench shell -->
    <div class="fixed inset-0 overflow-y-hidden">
        <!-- Brand anchor & logo - fixed in top left corner above workbench body, always visible -->
        <div class="fixed top-0 left-0 z-20 flex h-13.75 w-16 flex-col items-center justify-center">
            <Button aria-label="DPU logo" size="icon-lg" variant="ghost">
                <DPULogoIcon class="size-7" />
            </Button>
        </div>

        <!-- Assistant toggle - fixed in top right corner above workbench body, always visible -->
        <Button
            :aria-label="assistToggleAriaLabel"
            class="fixed top-2 right-3 z-20 flex cursor-pointer items-center justify-center rounded-full"
            size="icon-lg"
            variant="ghost"
            @click="toggleAssistPanel"
        >
            <Sparkles class="size-6" :stroke-width="1.25" />
        </Button>

        <!-- Workbench body -->
        <div class="z-10 flex h-full">
            <!-- Benchtop option (navigation) bar - fixed to left side of browser window -->
            <BenchtopOptionBar class="flex-none" />

            <!-- Workbench content column -->
            <div class="flex flex-1 flex-col">
                <!-- Workbench content area - fills browser window between benchtop option bar and assistant panel -->
                <div class="flex-1 overflow-y-hidden rounded-b-lg">
                    <RouterView />
                </div>

                <!-- Status bar - positioned at bottom of browser window below workbench body -->
                <StatusBar class="flex-none" />
            </div>

            <!-- Assistant panel - fixed to right side of browser window -->
            <AssistantPanel
                class="flex-none"
                :is-open="isAssistPanelOpenInWideDisplay"
                :is-floating-open="isAssistPanelOpenInNarrowDisplay"
                @request-close="isAssistPanelOpenInNarrowDisplay = false"
            />
        </div>
    </div>
</template>
