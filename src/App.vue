<script setup lang="ts">
// Vendor dependencies
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { useColorMode, useMediaQuery } from '@vueuse/core';

// Application core
import { useAuthDialog } from '@/composables/useAuthDialog';
import { useSessionStore } from '@/stores/sessionStore';

// Components
import AssistantIcon from '@/components/icon/AssistantIcon.vue';
const AssistantPanel = defineAsyncComponent(() => import('@/components/block/assistant/AssistantPanel.vue'));
const AuthDialog = defineAsyncComponent(() => import('@/components/AuthDialog.vue'));
import BenchtopOptionBar from '@/components/block/optionBar/OptionBar.vue';
import Button from '@/components/base/button/Button.vue';
import DPULogoIcon from '@/components/icon/logos/DPULogoIcon.vue';
import StatusBar from '@/components/block/statusBar/StatusBar.vue';
import { useEventWorker } from './composables/useEventWorker';

// Global state
const sessionState = useSessionStore();
const { showAuthDialog } = useAuthDialog();
useColorMode();

// Display width state
const isDisplayWide = useMediaQuery('(min-width: 768px)');

// Benchtop option bar states
const isBenchtopOptionBarOpenInNarrowDisplay = ref(false);
const benchtopOptionBarToggleAriaLabel = computed(() => {
    if (isDisplayWide.value) return 'DPU logo';
    return isBenchtopOptionBarOpenInNarrowDisplay.value ? 'Hide navigation bar' : 'Show navigation bar';
});

// Assistant panel states
const isAssistPanelOpenInWideDisplay = ref(false);
const isAssistPanelOpenInNarrowDisplay = ref(false);
const assistPanelToggleAriaLabel = computed(() => {
    const isPanelVisible = isDisplayWide.value ? isAssistPanelOpenInWideDisplay.value : isAssistPanelOpenInNarrowDisplay.value;
    return isPanelVisible ? 'Hide assistant panel' : 'Show assistant panel';
});

watch(useEventWorker().workerReady, (newWorkerReady) => {
    if (newWorkerReady) useEventWorker().postEvent('this is a test...');
});

// Lifecycle hooks
onMounted(() => sessionState.initServices()); // Initialise authentication, module status and monitor services.

// Hide narrow versions of option bar and assistant panels when display width transitions from narrow to wide
watch(isDisplayWide, (newIsDisplayWide) => {
    if (newIsDisplayWide) {
        isAssistPanelOpenInNarrowDisplay.value = false;
        isBenchtopOptionBarOpenInNarrowDisplay.value = false;
    }
});

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function toggleBenchtopOptionBar() {
    if (isDisplayWide.value) return;
    isBenchtopOptionBarOpenInNarrowDisplay.value = !isBenchtopOptionBarOpenInNarrowDisplay.value;
}

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
    <div class="fixed inset-0">
        <!-- Brand anchor & logo - fixed in top left corner above workbench body, always visible -->
        <div class="fixed top-0 left-0 z-50 flex h-13.75 w-16 flex-col items-center justify-center">
            <Button
                :aria-label="benchtopOptionBarToggleAriaLabel"
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
            :aria-label="assistPanelToggleAriaLabel"
            class="fixed top-1.75 right-4 z-20 flex cursor-pointer items-center justify-center rounded-full"
            size="icon-lg"
            variant="ghost"
            @click="toggleAssistPanel"
        >
            <AssistantIcon class="size-6" :stroke-width="1.25" />
        </Button>

        <!-- Global Auth Dialog -->
        <AuthDialog v-if="showAuthDialog" />

        <!-- Workbench body -->
        <div class="z-10 flex h-full">
            <!-- Benchtop option (navigation) bar - fixed to left side of browser window -->
            <BenchtopOptionBar
                class="flex-none"
                :is-wide-display="isDisplayWide"
                :is-floating-open="isBenchtopOptionBarOpenInNarrowDisplay"
                :session-is-authenticated="sessionState.sessionStatus.isAuthenticated"
                @request-close="isBenchtopOptionBarOpenInNarrowDisplay = false"
            />

            <!-- Workbench content column - fills browser window between benchtop option bar and assistant panel -->
            <div class="flex min-w-0 flex-1 flex-col">
                <!-- Workbench content area row - fills content column above status bar row  -->
                <div class="flex-1 overflow-y-hidden rounded-b-lg">
                    <RouterView v-slot="{ Component }">
                        <component :is="Component" :is-display-wide="isDisplayWide" />
                    </RouterView>
                </div>

                <!-- Status bar row - positioned at bottom of workbench content column -->
                <StatusBar class="flex-none" />
            </div>

            <!-- Assistant panel - fixed to right side of browser window -->
            <AssistantPanel
                v-if="isAssistPanelOpenInWideDisplay || isAssistPanelOpenInNarrowDisplay"
                class="flex-none"
                :is-open="isAssistPanelOpenInWideDisplay"
                :is-floating-open="isAssistPanelOpenInNarrowDisplay"
                @request-close="isAssistPanelOpenInNarrowDisplay = false"
            />
        </div>
    </div>
</template>
