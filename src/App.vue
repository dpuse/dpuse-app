<script setup lang="ts">
// Vendor dependencies
import { useRoute } from 'vue-router';
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useColorMode, useMediaQuery } from '@vueuse/core';

// Workbench core
import { useSessionStore } from '@/stores/sessionStore';

// Workbench components
import AssistantIcon from '@/components/icon/AssistantIcon.vue';
import AssistantPanel from '@/components/block/assistant/AssistantPanel.vue';
import BenchtopOptionBar from '@/components/block/optionBar/OptionBar.vue';
import DPULogoIcon from '@/components/icon/logos/DPULogoIcon.vue';
import IconActionContent from '@/components/base/IconActionContent.vue';

// Workbench components (Lazy load)
// TODO: const AssistantPanel = defineAsyncComponent(() => import('@/components/block/assistant/AssistantPanel.vue'));
const AuthDialog = defineAsyncComponent(() => import('@/components/block/account/AuthDialog.vue'));

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

// Hide narrow versions of option bar and assistant panels when display width transitions from narrow to wide
watch(isDisplayWide, (newIsDisplayWide) => {
    if (newIsDisplayWide) {
        isAssistPanelOpenInNarrowDisplay.value = false;
        isBenchtopOptionBarOpenInNarrowDisplay.value = false;
    }
});

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleToggleBenchtopOptionBar() {
    if (isDisplayWide.value) return;
    isBenchtopOptionBarOpenInNarrowDisplay.value = !isBenchtopOptionBarOpenInNarrowDisplay.value;
}

function handleToggleAssistPanel() {
    if (isDisplayWide.value) {
        isAssistPanelOpenInWideDisplay.value = !isAssistPanelOpenInWideDisplay.value;
        return;
    }
    isAssistPanelOpenInNarrowDisplay.value = !isAssistPanelOpenInNarrowDisplay.value;
}
</script>

<template>
    <!-- Workbench shell -->
    <div class="bg-background-secondary text-foreground-primary fixed inset-0">
        <!-- Brand anchor & logo fixed in top left corner above workbench body, always visible -->
        <div class="group fixed top-0 left-0 z-40 flex h-13.75 w-16 flex-col items-center justify-center">
            <button class="group outline-none">
                <IconActionContent
                    :aria-label="benchtopOptionBarToggleAriaLabel"
                    :aria-pressed="!isDisplayWide ? isBenchtopOptionBarOpenInNarrowDisplay : undefined"
                    @click="handleToggleBenchtopOptionBar"
                >
                    <DPULogoIcon class="size-6" />
                </IconActionContent>
            </button>
        </div>

        <!-- Assistant toggle fixed in top right corner above workbench body, always visible -->
        <IconActionContent
            :aria-label="assistPanelToggleAriaLabel"
            class="fixed top-1.75 right-4 z-20 flex cursor-pointer items-center justify-center rounded-full"
            @click="handleToggleAssistPanel"
        >
            <AssistantIcon class="size-6" :stroke-width="1.25" />
        </IconActionContent>

        <!-- Authentication dialog activated using url parameter 'dialog=auth' -->
        <AuthDialog v-if="authDialogIsVisible" />

        <!-- Body -->
        <div class="z-10 flex h-full">
            <!-- Column fixed to left side of browser window -->
            <BenchtopOptionBar
                class="flex-none"
                :is-wide-display="isDisplayWide"
                :is-floating-open="isBenchtopOptionBarOpenInNarrowDisplay"
                :session-is-authenticated="sessionState.isAuthenticated"
                @select="isBenchtopOptionBarOpenInNarrowDisplay = false"
            />

            <!-- Column filling workbench body between benchtop option bar and assistant panel -->
            <div class="flex-1 overflow-y-hidden">
                <RouterView v-slot="{ Component }">
                    <component :is="Component" :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-display-wide="isDisplayWide" />
                </RouterView>
            </div>

            <!-- Column fixed to right side of browser window -->
            <AssistantPanel :is-open="isAssistPanelOpenInWideDisplay" :is-floating-open="isAssistPanelOpenInNarrowDisplay" @close="isAssistPanelOpenInNarrowDisplay = false" />
        </div>
    </div>
</template>
