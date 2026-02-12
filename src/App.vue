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
import KnowledgeOptionBar from '@/components/block/knowledgeOptionBar/KnowledgeOptionBar.vue';

// Workbench components (Lazy loaded)
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

// Split pane state
const splitPercent = ref(50);
const isDraggingSplitter = ref(false);

// Authentication dialog state
const authDialogIsVisible = computed(() => route.query.dialog === 'auth');

// Lifecycle event handlers
onMounted(() => useSessionStore().initialiseServices());

// Hide narrow option bar when display width transitions from narrow to wide
watch(isWideDisplay, (newIsDisplayWide) => {
    if (newIsDisplayWide) {
        isOptionBarOpenInNarrowDisplay.value = false;
    }
});

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleToggleOptionBar(): void {
    if (isWideDisplay.value) return;
    isOptionBarOpenInNarrowDisplay.value = !isOptionBarOpenInNarrowDisplay.value;
}

function handleSplitterPointerDown(event: PointerEvent): void {
    isDraggingSplitter.value = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
}

function handleSplitterPointerMove(event: PointerEvent): void {
    if (!isDraggingSplitter.value) return;
    const percent = (event.clientX / window.innerWidth) * 100;
    splitPercent.value = Math.min(Math.max(percent, 20), 80);
}

function handleSplitterPointerUp(): void {
    isDraggingSplitter.value = false;
}
</script>

<template>
    <div class="bg-background-primary text-foreground-primary fixed inset-0 flex" :class="{ 'select-none': isDraggingSplitter }">
        <!-- Benchtop toggle fixed in top left corner, always visible -->
        <button class="group fixed top-1.75 left-3 z-40 outline-none">
            <IconActionContent :aria-label="optionBarToggleAriaLabel" :aria-pressed="!isWideDisplay ? isOptionBarOpenInNarrowDisplay : undefined" @click="handleToggleOptionBar">
                <DPULogoIcon class="size-6" />
            </IconActionContent>
        </button>

        <!-- Assistant toggle fixed in top right corner, always visible -->
        <button class="group fixed top-1.75 right-3 z-40 outline-none">
            <IconActionContent aria-label="Assistant">
                <AssistantIcon class="size-6" />
            </IconActionContent>
        </button>

        <!-- Authentication dialog activated using url parameter 'dialog=auth' -->
        <AuthDialog v-if="authDialogIsVisible" />

        <!-- Left pane: Benchtop (option bar + workbench body) -->
        <div class="flex h-full min-w-0" :style="{ width: splitPercent + '%' }">
            <OptionBar
                class="flex-none"
                :is-open-in-narrow-display="isOptionBarOpenInNarrowDisplay"
                :is-wide-display="isWideDisplay"
                :session-is-authenticated="sessionState.isAuthenticated"
                @select="isOptionBarOpenInNarrowDisplay = false"
            />
            <div class="flex-1 overflow-y-hidden">
                <RouterView v-slot="{ Component }">
                    <component :is="Component" :is-assist-panel-open-in-wide-display="true" :is-wide-display="isWideDisplay" />
                </RouterView>
            </div>
        </div>

        <!-- Vertical splitter for resizing panes -->
        <div
            class="border-border hover:bg-separator active:bg-separator h-full w-1 flex-none cursor-col-resize border-x transition-colors"
            @pointerdown="handleSplitterPointerDown"
            @pointermove="handleSplitterPointerMove"
            @pointerup="handleSplitterPointerUp"
        />

        <!-- Right pane: Assistant (assistant body + option bar) -->
        <div class="flex h-full min-w-0 flex-1">
            <AssistantPanel :is-wide-display="isWideDisplay" />
            <KnowledgeOptionBar
                class="flex-none"
                :is-open-in-narrow-display="isOptionBarOpenInNarrowDisplay"
                :is-wide-display="isWideDisplay"
                :session-is-authenticated="sessionState.isAuthenticated"
                @select="isOptionBarOpenInNarrowDisplay = false"
            />
        </div>
    </div>
</template>
