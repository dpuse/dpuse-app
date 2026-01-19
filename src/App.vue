<script setup lang="ts">
// Vendor dependencies.
import { onMounted, ref } from 'vue';

// Global state dependencies.
import { useSessionStore } from '@/stores/sessionStore';

// Component dependencies.
import AssistantPanel from '@/components/assistant/AssistantPanel.vue';
import BenchtopOptionBar from '@/components/optionBar/OptionBar.vue';
import BrandLogo from '@/components/brand/BrandLogo.vue';
import Button from '@/components/ui/button/Button.vue';
import Icon from '@/components/Icon.vue';
import Separator from '@/components/ui/separator/Separator.vue';
import StatusBar from '@/components/statusBar/StatusBar.vue';

// Assistant panel state.
const isAssistantPanelOpen = ref(true);

// Initialize session services (authentication, messenger) after the root app mounts.
onMounted(() => useSessionStore().initServices());
</script>

<template>
    <!-- Workbench shell. -->
    <div class="fixed inset-0 flex flex-col overflow-hidden">
        <!-- Brand anchor & logo - fixed in top left corner above workbench body, always visible.  -->
        <div class="fixed top-0 left-0 z-20 flex h-14 w-18 flex-col items-center justify-center">
            <div class="flex flex-1 items-center">
                <BrandLogo class="flex-1" compact />
            </div>
            <Separator class="flex-none px-2" />
        </div>

        <!-- Assistant toggle button - fixed in top right corner above workbench body, always visible. -->
        <Button
            :aria-label="isAssistantPanelOpen ? 'Hide assistant panel' : 'Show assistant panel'"
            class="fixed top-2.75 right-2 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full p-0"
            color="neutral"
            :variant="isAssistantPanelOpen ? 'ghost' : 'soft'"
            @click="isAssistantPanelOpen = !isAssistantPanelOpen"
        >
            <Icon :name="isAssistantPanelOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'" class="size-5" />
        </Button>

        <!-- Workbench body -->
        <div class="z-10 flex flex-1 overflow-y-hidden">
            <!-- Benchtop option (navigation) bar - fixed to left side of browser window. -->
            <BenchtopOptionBar />

            <!-- Workbench content area - fills browser window between benchtop option bar and assistant panel. -->
            <div class="flex-1">
                <RouterView />
            </div>

            <!-- Assistant panel - fixed to right side of browser window. -->
            <AssistantPanel :is-open="isAssistantPanelOpen" />
        </div>

        <!-- Status bar - positioned at bottom of browser window below workbench body. -->
        <StatusBar />
    </div>
</template>
