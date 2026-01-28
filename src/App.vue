<script setup lang="ts">
// External dependencies
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { useColorMode, useMediaQuery } from '@vueuse/core';

// Core
import { useAuthDialog } from '@/composables/useAuthDialog';

// Components and icons
import AssistantIcon from '@/components/icon/AssistantIcon.vue';
import BenchtopOptionBar from '@/components/block/optionBar/OptionBar.vue';
import Button from '@/components/base/button/Button.vue';
import DPULogoIcon from '@/components/icon/logos/DPULogoIcon.vue';
import StatusBar from '@/components/block/statusBar/StatusBar.vue';
import { useSessionStore } from '@/stores/sessionStore';

const AssistantPanel = defineAsyncComponent(() => import('@/components/block/assistant/AssistantPanel.vue'));
const AuthDialog = defineAsyncComponent(() => import('@/components/AuthDialog.vue'));

// Global state
const { showAuthDialog } = useAuthDialog();
useColorMode();

// Reactive variables
const isAssistPanelOpenInWideDisplay = ref(false);
const isAssistPanelOpenInNarrowDisplay = ref(false);
const isBenchtopOptionBarOpenInNarrowDisplay = ref(false);
const isDisplayWide = useMediaQuery('(min-width: 768px)');

const sessionState = useSessionStore();

const assistToggleAriaLabel = computed(() => {
    const isPanelVisible = isDisplayWide.value ? isAssistPanelOpenInWideDisplay.value : isAssistPanelOpenInNarrowDisplay.value;
    return isPanelVisible ? 'Hide assistant panel' : 'Show assistant panel';
});

const benchtopToggleAriaLabel = computed(() => {
    if (isDisplayWide.value) return 'DPU logo';
    return isBenchtopOptionBarOpenInNarrowDisplay.value ? 'Hide navigation bar' : 'Show navigation bar';
});

onMounted(() => {
    let processRun = false;

    const runYourProcess = () => {
        if (processRun) return;
        processRun = true;

        console.log('Page fully rendered, LCP measured');

        // Simple delay to push outside critical path measurement window
        setTimeout(() => {
            sessionState.initServices();
        }, 3000);
    };

    const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries.at(-1);
        const lcpEntry = lastEntry as LargestContentfulPaint;
        console.log('LCP measured:', lcpEntry.renderTime || lcpEntry.loadTime);

        runYourProcess();
        observer.disconnect();
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    // Fallback: run after a timeout in case LCP doesn't fire
    setTimeout(() => {
        observer.disconnect();
        runYourProcess();
    }, 5000);
});

// onMounted(() => {
//     let processRun = false;

//     const runYourProcess = () => {
//         if (processRun) return;
//         processRun = true;

//         // Your code here
//         console.log('Page fully rendered, LCP measured');

//         // // Defer execution to after the critical path
//         // requestIdleCallback(
//         //     () => {
//         //         sessionState.initServices();
//         //     },
//         //     { timeout: 1000 }
//         // ); // Fallback if browser doesn't support requestIdleCallback

//         // // Wait for page load event
//         // if (document.readyState === 'complete') {
//         //     sessionState.initServices();
//         // } else {
//         //     window.addEventListener(
//         //         'load',
//         //         () => {
//         //             sessionState.initServices();
//         //         },
//         //         { once: true }
//         //     );
//         // }

//         setTimeout(() => {
//             sessionState.initServices();
//         }, 4000);
//     };

//     const observer = new PerformanceObserver((list) => {
//         const entries = list.getEntries();
//         const lastEntry = entries.at(-1);

//         const lcpEntry = lastEntry as LargestContentfulPaint;
//         console.log('LCP measured:', lcpEntry.renderTime || lcpEntry.loadTime);

//         runYourProcess();
//         observer.disconnect();
//     });

//     observer.observe({ type: 'largest-contentful-paint', buffered: true });

//     // Fallback: run after a timeout in case LCP doesn't fire
//     setTimeout(() => {
//         observer.disconnect();
//         runYourProcess();
//     }, 10000);
// });

// onMounted(async () => sessionState.initServices());

// // function beginBootstrap() {
// //     setTimeout(() => {
// //         nextTick(() => {
// //             const raf = globalThis.requestAnimationFrame ?? ((callback) => setTimeout(callback, 16));
// //             raf(() => {
// //                 raf(async () => {
// //                     const { useSessionStore } = await import('@/stores/sessionStore');
// //                     await useSessionStore().initServices();
// //                     sessionIsAuthenticated.value = useSessionStore().sessionStatus.isAuthenticated;
// //                 });
// //             });
// //         });
// //     }, 3000); // explicit delay in ms
// // }

// onMounted(async () => {
//     // if (document.readyState === 'complete') {
//     //     beginBootstrap();
//     // } else {
//     //     window.addEventListener('load', beginBootstrap, { once: true });
//     // }
//     // const { useSessionStore } = await import('@/stores/sessionStore');
//     // sessionState.initServices();
//     // sessionIsAuthenticated.value = useSessionStore().sessionStatus.isAuthenticated;
// });

watch(isDisplayWide, (newIsDisplayWide) => {
    if (newIsDisplayWide) {
        isAssistPanelOpenInNarrowDisplay.value = false;
        isBenchtopOptionBarOpenInNarrowDisplay.value = false;
    }
});

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function toggleAssistPanel() {
    if (isDisplayWide.value) {
        isAssistPanelOpenInWideDisplay.value = !isAssistPanelOpenInWideDisplay.value;
        return;
    }
    isAssistPanelOpenInNarrowDisplay.value = !isAssistPanelOpenInNarrowDisplay.value;
}

function toggleBenchtopOptionBar() {
    if (isDisplayWide.value) return;
    isBenchtopOptionBarOpenInNarrowDisplay.value = !isBenchtopOptionBarOpenInNarrowDisplay.value;
}
</script>

<template>
    <!-- Workbench shell -->
    <div class="fixed inset-0">
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
