<script setup lang="ts">
// External dependencies
import { useRoute } from 'vue-router';
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { useColorMode, useMediaQuery } from '@vueuse/core';

// Workbench core
import { useSessionStore } from '@/stores/sessionStore';

// Workbench components
import AssistantIcon from '@/components/icon/AssistantIcon.vue';
import AssistantPanel from '@/components/block/assistant/AssistantPanel.vue';
import DPULogoIcon from '@/components/icon/logos/DPULogoIcon.vue';
import IconActionContent from '@/components/base/IconActionContent.vue';
import OptionBar from '@/components/block/optionBar/OptionBar.vue';

// Workbench components (Lazy loaded)
// TODO: const AssistantPanel = defineAsyncComponent(() => import('@/components/block/assistant/AssistantPanel.vue'));
const AuthDialog = defineAsyncComponent(() => import('@/components/block/account/AuthDialog.vue'));

// Global state
useColorMode();
const route = useRoute();
const sessionState = useSessionStore();

// Display narrow/wide state
const isWideDisplay = useMediaQuery('(min-width: 768px)');

// Option bar states
const isOptionBarOpenInNarrowDisplay = ref(false);
const optionBarToggleAriaLabel = computed(() => {
    if (isWideDisplay.value) return 'DPU logo';
    return isOptionBarOpenInNarrowDisplay.value ? 'Hide navigation bar' : 'Show navigation bar';
});

// Assistant panel states
const isAssistPanelOpenInNarrowDisplay = ref(false);
const isAssistPanelOpenInWideDisplay = ref(false);
const assistPanelWidth = ref(400);
const isDraggingSplitter = ref(false);
const assistPanelToggleAriaLabel = computed(() => {
    const isPanelVisible = isWideDisplay.value ? isAssistPanelOpenInWideDisplay.value : isAssistPanelOpenInNarrowDisplay.value;
    return isPanelVisible ? 'Hide assistant panel' : 'Show assistant panel';
});

// Authentication dialog state
const authDialogIsVisible = computed(() => route.query.dialog === 'auth');

// Lifecycle event handlers
onMounted(() => useSessionStore().initialiseServices());

// Hide narrow versions of option bar and assistant panels when display width transitions from narrow to wide
watch(isWideDisplay, (newIsDisplayWide) => {
    if (newIsDisplayWide) {
        isAssistPanelOpenInNarrowDisplay.value = false;
        isOptionBarOpenInNarrowDisplay.value = false;
    }
});

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleToggleOptionBar(): void {
    if (isWideDisplay.value) return;
    isOptionBarOpenInNarrowDisplay.value = !isOptionBarOpenInNarrowDisplay.value;
}

function handleToggleAssistPanel(): void {
    if (isWideDisplay.value) {
        isAssistPanelOpenInWideDisplay.value = !isAssistPanelOpenInWideDisplay.value;
        return;
    }
    isAssistPanelOpenInNarrowDisplay.value = !isAssistPanelOpenInNarrowDisplay.value;
}

function handleSplitterPointerDown(event: PointerEvent): void {
    isDraggingSplitter.value = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
}

function handleSplitterPointerMove(event: PointerEvent): void {
    if (!isDraggingSplitter.value) return;
    const newWidth = window.innerWidth - event.clientX;
    assistPanelWidth.value = Math.min(Math.max(newWidth, 250), 800);
}

function handleSplitterPointerUp(): void {
    isDraggingSplitter.value = false;
}
</script>

<template>
    <div class="bg-background-primary text-foreground-primary fixed inset-0" :class="{ 'select-none': isDraggingSplitter }">
        <!-- Brand anchor & logo fixed in top left corner above workbench body, always visible -->
        <div class="group fixed top-0 left-0 z-40 flex h-13.75 w-16 flex-col items-center justify-center">
            <button class="group outline-none">
                <IconActionContent
                    :aria-label="optionBarToggleAriaLabel"
                    :aria-pressed="!isWideDisplay ? isOptionBarOpenInNarrowDisplay : undefined"
                    @click="handleToggleOptionBar"
                >
                    <DPULogoIcon class="size-6" />
                </IconActionContent>
            </button>
        </div>

        <!-- Assistant toggle fixed in top right corner above workbench body, always visible -->
        <IconActionContent
            :aria-label="assistPanelToggleAriaLabel"
            class="fixed top-1.75 right-3 z-20 flex cursor-pointer items-center justify-center rounded-full"
            @click="handleToggleAssistPanel"
        >
            <AssistantIcon class="size-6" :stroke-width="1.25" />
        </IconActionContent>

        <!-- Authentication dialog activated using url parameter 'dialog=auth' -->
        <AuthDialog v-if="authDialogIsVisible" />

        <!-- Workbench body -->
        <div class="z-10 flex h-full">
            <!-- Column for option bar fixed to left side of browser window -->
            <OptionBar
                class="flex-none"
                :is-open-in-narrow-display="isOptionBarOpenInNarrowDisplay"
                :is-wide-display="isWideDisplay"
                :session-is-authenticated="sessionState.isAuthenticated"
                @select="isOptionBarOpenInNarrowDisplay = false"
            />
            <!-- Column filling workbench body between option bar and assistant panel -->
            <div class="flex-1 overflow-y-hidden">
                <RouterView v-slot="{ Component }">
                    <component :is="Component" :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-wide-display="isWideDisplay" />
                </RouterView>
            </div>

            <!-- Vertical splitter for resizing assistant panel -->
            <div
                v-if="isAssistPanelOpenInWideDisplay && isWideDisplay"
                class="group hidden w-1.5 flex-none cursor-col-resize items-center justify-center md:flex"
                @pointerdown="handleSplitterPointerDown"
                @pointermove="handleSplitterPointerMove"
                @pointerup="handleSplitterPointerUp"
            >
                <div class="bg-separator/50 group-hover:bg-separator group-active:bg-separator h-full w-px transition-colors" />
            </div>

            <!-- Column for assistant panel fixed to right side of browser window -->
            <AssistantPanel
                :is-open-in-wide-display="isAssistPanelOpenInWideDisplay"
                :is-open-in-narrow-display="isAssistPanelOpenInNarrowDisplay"
                :is-wide-display="isWideDisplay"
                :panel-width="assistPanelWidth"
                :is-dragging="isDraggingSplitter"
                @close="isAssistPanelOpenInNarrowDisplay = false"
                @update:panel-width="assistPanelWidth = $event"
            />

            <OptionBar
                class="flex-none"
                :is-open-in-narrow-display="isOptionBarOpenInNarrowDisplay"
                :is-wide-display="isWideDisplay"
                :session-is-authenticated="sessionState.isAuthenticated"
                @select="isOptionBarOpenInNarrowDisplay = false"
            />
        </div>
    </div>
</template>
