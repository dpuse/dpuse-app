<script setup lang="ts">
// Vendor dependencies.
import { useColorMode, useMediaQuery } from '@vueuse/core';
import { computed, onMounted, ref, watch } from 'vue';

// Global state dependencies.
import { useSessionStore } from '@/stores/sessionStore';

import { Sparkles } from 'lucide-vue-next';

// Component dependencies.
import AssistantPanel from '@/components/assistant/AssistantPanel.vue';
import BenchtopOptionBar from '@/components/optionBar/OptionBar.vue';
import DPULogo from '@/components/icon/logo/DPULogo.vue';
import Button from '@/components/ui/button/Button.vue';
import StatusBar from '@/components/statusBar/StatusBar.vue';

// Assistant panel state.
const isAssistantPanelOpen = ref(true);
const isMobileAssistantPanelOpen = ref(false);
const isDesktopViewport = useMediaQuery('(min-width: 768px)');

const assistantToggleLabel = computed(() => {
    const isPanelVisible = isDesktopViewport.value ? isAssistantPanelOpen.value : isMobileAssistantPanelOpen.value;
    return isPanelVisible ? 'Hide assistant panel' : 'Show assistant panel';
});

const toggleAssistantPanel = () => {
    if (isDesktopViewport.value) {
        isAssistantPanelOpen.value = !isAssistantPanelOpen.value;
        return;
    }

    isMobileAssistantPanelOpen.value = !isMobileAssistantPanelOpen.value;
};

watch(isDesktopViewport, (isDesktop) => {
    if (isDesktop) {
        isMobileAssistantPanelOpen.value = false;
    }
});

// ???
useColorMode();

// Initialize session services (authentication, messenger) after the root app mounts.
onMounted(() => useSessionStore().initServices());
</script>

<template>
    <!-- Workbench shell. -->
    <div class="fixed inset-0 h-full overflow-y-hidden">
        <!-- Brand anchor & logo - fixed in top left corner above workbench body, always visible.  -->
        <div class="fixed top-0 left-0 z-20 flex h-14 w-16 flex-col items-center justify-center">
            <Button aria-label="Datapos brand" size="icon-lg" variant="ghost">
                <DPULogo class="size-7" />
            </Button>
        </div>

        <!-- Assistant toggle button - fixed in top right corner above workbench body, always visible. -->
        <Button
            :aria-label="assistantToggleLabel"
            class="fixed top-2 right-3 z-20 flex cursor-pointer items-center justify-center rounded-full"
            size="icon-lg"
            variant="ghost"
            @click="toggleAssistantPanel"
        >
            <Sparkles class="size-6" :stroke-width="1.25" />
        </Button>

        <!-- Workbench body -->
        <div class="z-10 flex h-full">
            <!-- Benchtop option (navigation) bar - fixed to left side of browser window. -->
            <BenchtopOptionBar class="flex-none" />

            <div class="flex flex-1 flex-col">
                <!-- Workbench content area - fills browser window between benchtop option bar and assistant panel. -->
                <div class="flex-1 overflow-y-hidden rounded-b-lg">
                    <RouterView />
                </div>

                <!-- Status bar - positioned at bottom of browser window below workbench body. -->
                <StatusBar class="flex-none" />
            </div>

            <!-- Assistant panel - fixed to right side of browser window. -->
            <AssistantPanel class="flex-none" :is-open="isAssistantPanelOpen" :is-floating-open="isMobileAssistantPanelOpen" @request-close="isMobileAssistantPanelOpen = false" />
        </div>
    </div>
</template>
