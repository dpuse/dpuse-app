<script setup lang="ts">
// Vendor dependencies
import { useRoute } from 'vue-router';
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { useColorMode, useMediaQuery } from '@vueuse/core';

// Application core
import { useSessionStore } from '@/stores/sessionStore';

// Components
import AssistantIcon from '@/components/icon/AssistantIcon.vue';
import BenchtopOptionBar from '@/components/block/optionBar/OptionBar.vue';
import DPULogoIcon from '@/components/icon/logos/DPULogoIcon.vue';
import IconButton from '@/components/base/IconButton.vue';

// Components (Lazy load)
const AssistantPanel = defineAsyncComponent(() => import('@/components/block/assistant/AssistantPanel.vue'));
const AuthDialog = defineAsyncComponent(() => import('@/components/block/account/AuthDialog.vue'));
const StatusBar = defineAsyncComponent(() => import('@/components/block/statusBar/StatusBar.vue'));

// Global state
useColorMode();
const route = useRoute();
const sessionState = useSessionStore();

// Display wide width state
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

// Authentication dialog state
const authDialogIsVisible = computed(() => route.query.dialog === 'auth');

// Initialise authentication and monitor services
// onMounted(() => sessionState.initServices());

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
        <!-- Brand anchor & logo fixed in top left corner above workbench body, always visible -->
        <div class="fixed top-0 left-0 z-50 flex h-13.75 w-16 flex-col items-center justify-center">
            <IconButton
                :aria-label="benchtopOptionBarToggleAriaLabel"
                :aria-pressed="!isDisplayWide ? isBenchtopOptionBarOpenInNarrowDisplay : undefined"
                @click="toggleBenchtopOptionBar"
            >
                <DPULogoIcon class="size-7" />
            </IconButton>
        </div>

        <!-- Assistant toggle fixed in top right corner above workbench body, always visible -->
        <IconButton
            :aria-label="assistPanelToggleAriaLabel"
            class="fixed top-1.75 right-4 z-20 flex cursor-pointer items-center justify-center rounded-full"
            @click="toggleAssistPanel"
        >
            <AssistantIcon class="size-6" :stroke-width="1.25" />
        </IconButton>

        <!-- Authentication dialog activated using url parameter 'dialog=auth' -->
        <AuthDialog v-if="authDialogIsVisible" />

        <!-- Body -->
        <div class="z-10 flex h-full">
            <!-- Column fixed to left side of browser window -->
            <BenchtopOptionBar
                class="flex-none"
                :is-wide-display="isDisplayWide"
                :is-floating-open="isBenchtopOptionBarOpenInNarrowDisplay"
                :session-is-authenticated="sessionState.sessionStatus.isAuthenticated"
                @request-close="isBenchtopOptionBarOpenInNarrowDisplay = false"
            />

            <!-- Column filling workbench body between benchtop option bar and assistant panel -->
            <div class="flex min-w-0 flex-1 flex-col">
                <!-- Row filling content column above status bar row  -->
                <div class="flex-1 overflow-y-hidden rounded-b-lg">
                    <RouterView v-slot="{ Component }">
                        <component :is="Component" :is-display-wide="isDisplayWide" />
                    </RouterView>
                </div>

                <!-- Row positioned at bottom of workbench content column -->
                <div class="h-5.5 flex-none">
                    <StatusBar />
                </div>
            </div>

            <!-- Column fixed to right side of browser window -->
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
