<script setup lang="ts">
// External dependencies
import { computed, onMounted, ref, watch } from 'vue';
import { useColorMode, useMediaQuery } from '@vueuse/core';

// Application modules
import { useSessionStore } from '@/stores/sessionStore';

// Components and icons
import AssistantPanel from '@/components/block/assistant/AssistantPanel.vue';
import BenchtopOptionBar from '@/components/block/optionBar/OptionBar.vue';
import Button from '@/components/base/button/Button.vue';
import DPULogoIcon from '@/components/icon/logos/DPULogoIcon.vue';
import { Sparkles } from 'lucide-vue-next';
import StatusBar from '@/components/block/statusBar/StatusBar.vue';

// Global state
useColorMode();

// Reactive variables
const isAssistPanelOpenInWideDisplay = ref(true);
const isAssistPanelOpenInNarrowDisplay = ref(false);
const isBenchtopOptionBarOpenInNarrowDisplay = ref(false);
const isDisplayWide = useMediaQuery('(min-width: 768px)');

// Lifecycle event handlers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(() => useSessionStore().initServices()); // Initialize session services (authentication, messenger) after the app component mounts

// Display (browser window) width state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

watch(isDisplayWide, (newIsDisplayWide) => {
    if (newIsDisplayWide) {
        isAssistPanelOpenInNarrowDisplay.value = false;
        isBenchtopOptionBarOpenInNarrowDisplay.value = false;
    }
});

// Assistant panel state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const assistToggleAriaLabel = computed(() => {
    const isPanelVisible = isDisplayWide.value ? isAssistPanelOpenInWideDisplay.value : isAssistPanelOpenInNarrowDisplay.value;
    return isPanelVisible ? 'Hide assistant panel' : 'Show assistant panel';
});

function toggleAssistPanel() {
    if (isDisplayWide.value) {
        isAssistPanelOpenInWideDisplay.value = !isAssistPanelOpenInWideDisplay.value;
        return;
    }
    isAssistPanelOpenInNarrowDisplay.value = !isAssistPanelOpenInNarrowDisplay.value;
}

// Benchtop option bar state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const benchtopToggleAriaLabel = computed(() => {
    if (isDisplayWide.value) return 'DPU logo';
    return isBenchtopOptionBarOpenInNarrowDisplay.value ? 'Hide navigation bar' : 'Show navigation bar';
});

function toggleBenchtopOptionBar() {
    if (isDisplayWide.value) return;
    isBenchtopOptionBarOpenInNarrowDisplay.value = !isBenchtopOptionBarOpenInNarrowDisplay.value;
}
</script>

<template>
    <!-- Workbench shell -->
    <div class="fixed inset-0 overflow-y-hidden">
        <!-- Brand anchor & logo - fixed in top left corner above workbench body, always visible -->
        <div class="fixed top-0 left-0 z-50 flex h-13.75 w-16 flex-col items-center justify-center">
            <Button
                :aria-label="benchtopToggleAriaLabel"
                :aria-pressed="!isDisplayWide ? isBenchtopOptionBarOpenInNarrowDisplay : undefined"
                size="icon-lg"
                variant="ghost"
                @click="toggleBenchtopOptionBar"
            >
                <DPULogoIcon class="size-7" />
            </Button>
        </div>

        <!-- Assistant toggle - fixed in top right corner above workbench body, always visible -->
        <Button
            :aria-label="assistToggleAriaLabel"
            class="fixed top-1.75 right-4 z-20 flex cursor-pointer items-center justify-center rounded-full"
            size="icon-lg"
            variant="ghost"
            @click="toggleAssistPanel"
        >
            <Sparkles class="size-6" :stroke-width="1.25" />
        </Button>

        <!-- Workbench body -->
        <div class="z-10 flex h-full">
            <!-- Benchtop option (navigation) bar - fixed to left side of browser window -->
            <BenchtopOptionBar
                class="flex-none"
                :is-wide-display="isDisplayWide"
                :is-floating-open="isBenchtopOptionBarOpenInNarrowDisplay"
                @request-close="isBenchtopOptionBarOpenInNarrowDisplay = false"
            />

            <!-- Workbench content column - fills browser window between benchtop option bar and assistant panel -->
            <div class="flex flex-1 flex-col">
                <!-- Workbench content area row - fills content column above status bar row  -->
                <div class="flex-1 overflow-y-hidden rounded-b-lg">
                    <RouterView />
                </div>

                <!-- Status bar row - positioned at bottom of workbench content column -->
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
