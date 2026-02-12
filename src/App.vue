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
import KnowledgeOptionBar from '@/components/block/knowledgeOptionBar/KnowledgeOptionBar.vue';
import OptionBar from '@/components/block/optionBar/OptionBar.vue';

// Workbench components (Lazy loaded)
const AuthDialog = defineAsyncComponent(() => import('@/components/block/account/AuthDialog.vue'));

// Global state
useColorMode();
const route = useRoute();
const sessionState = useSessionStore();

// Display narrow/wide state
const isWideDisplay = useMediaQuery('(min-width: 768px)');

// Panel state
const activePanel = ref<'benchtop' | 'assistant'>('benchtop');
const isBenchtopToggledClosed = ref(false);
const isAssistantToggledClosed = ref(false);

// Option bar overlay state (narrow mode only)
const narrowOptionBarOpen = ref<'none' | 'benchtop' | 'assistant'>('none');

// Split pane state
const splitPercent = ref(50);
const isDraggingSplitter = ref(false);

// Authentication dialog state
const authDialogIsVisible = computed(() => route.query.dialog === 'auth');

// Panel visibility
const isBenchtopVisible = computed(() => {
    if (isWideDisplay.value) return !isBenchtopToggledClosed.value;
    return activePanel.value === 'benchtop';
});

const isAssistantVisible = computed(() => {
    if (isWideDisplay.value) return !isAssistantToggledClosed.value;
    return activePanel.value === 'assistant';
});

const isSplitterVisible = computed(() => {
    return isWideDisplay.value && isBenchtopVisible.value && isAssistantVisible.value;
});

// Pane layout classes and styles
const leftPaneClasses = computed(() => {
    if (isWideDisplay.value) {
        if (isBenchtopToggledClosed.value) return 'hidden';
        return 'flex h-full min-w-0';
    }
    // Narrow mode: use w-0 overflow-hidden for inactive pane so option bar overlays remain functional
    return activePanel.value === 'benchtop' ? 'flex h-full min-w-0 flex-1' : 'h-full w-0 overflow-hidden';
});

const leftPaneStyle = computed(() => {
    if (!isWideDisplay.value || isBenchtopToggledClosed.value) return {};
    if (isAssistantToggledClosed.value) return { flex: '1' };
    return { width: splitPercent.value + '%' };
});

const rightPaneClasses = computed(() => {
    if (isWideDisplay.value) {
        if (isAssistantToggledClosed.value) return 'hidden';
        return 'flex h-full min-w-0 flex-1';
    }
    return activePanel.value === 'assistant' ? 'flex h-full min-w-0 flex-1' : 'h-full w-0 overflow-hidden';
});

// Toggle button aria labels
const benchtopToggleAriaLabel = computed(() => {
    if (!isWideDisplay.value) return narrowOptionBarOpen.value === 'benchtop' ? 'Hide navigation bar' : 'Show navigation bar';
    return isBenchtopToggledClosed.value ? 'Show benchtop' : 'Hide benchtop';
});

const assistantToggleAriaLabel = computed(() => {
    if (!isWideDisplay.value) return narrowOptionBarOpen.value === 'assistant' ? 'Hide knowledge bar' : 'Show knowledge bar';
    return isAssistantToggledClosed.value ? 'Show assistant' : 'Hide assistant';
});

// Lifecycle event handlers
onMounted(() => useSessionStore().initialiseServices());

// Close option bar overlays on breakpoint transition
watch(isWideDisplay, () => {
    narrowOptionBarOpen.value = 'none';
});

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleBenchtopToggle(): void {
    if (isWideDisplay.value) {
        // Don't close if it's the only open panel
        if (!isBenchtopToggledClosed.value && isAssistantToggledClosed.value) return;
        isBenchtopToggledClosed.value = !isBenchtopToggledClosed.value;
        activePanel.value = isBenchtopToggledClosed.value ? 'assistant' : 'benchtop';
    } else {
        narrowOptionBarOpen.value = narrowOptionBarOpen.value === 'benchtop' ? 'none' : 'benchtop';
    }
}

function handleAssistantToggle(): void {
    if (isWideDisplay.value) {
        // Don't close if it's the only open panel
        if (!isAssistantToggledClosed.value && isBenchtopToggledClosed.value) return;
        isAssistantToggledClosed.value = !isAssistantToggledClosed.value;
        activePanel.value = isAssistantToggledClosed.value ? 'benchtop' : 'assistant';
    } else {
        narrowOptionBarOpen.value = narrowOptionBarOpen.value === 'assistant' ? 'none' : 'assistant';
    }
}

function handleBenchtopOptionSelect(): void {
    narrowOptionBarOpen.value = 'none';
    activePanel.value = 'benchtop';
}

function handleAssistantOptionSelect(): void {
    narrowOptionBarOpen.value = 'none';
    activePanel.value = 'assistant';
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
        <button class="group fixed top-1.75 left-3 z-40 outline-none" @click="handleBenchtopToggle">
            <IconActionContent :aria-label="benchtopToggleAriaLabel">
                <DPULogoIcon class="size-6" />
            </IconActionContent>
        </button>

        <!-- Assistant toggle fixed in top right corner, always visible -->
        <button class="group fixed top-1.75 right-3 z-40 outline-none" @click="handleAssistantToggle">
            <IconActionContent :aria-label="assistantToggleAriaLabel">
                <AssistantIcon class="size-6" />
            </IconActionContent>
        </button>

        <!-- Authentication dialog activated using url parameter 'dialog=auth' -->
        <AuthDialog v-if="authDialogIsVisible" />

        <!-- Left pane: Benchtop (option bar + workbench body) -->
        <div :class="leftPaneClasses" :style="leftPaneStyle">
            <OptionBar
                class="flex-none"
                :is-open-in-narrow-display="narrowOptionBarOpen === 'benchtop'"
                :is-wide-display="isWideDisplay"
                :session-is-authenticated="sessionState.isAuthenticated"
                @select="handleBenchtopOptionSelect"
            />
            <div class="flex-1 overflow-y-hidden">
                <RouterView v-slot="{ Component }">
                    <component :is="Component" :is-assist-panel-open-in-wide-display="true" :is-wide-display="isWideDisplay" />
                </RouterView>
            </div>
        </div>

        <!-- Vertical splitter for resizing panes -->
        <div
            v-if="isSplitterVisible"
            class="border-border hover:bg-separator active:bg-separator h-full w-1 flex-none cursor-col-resize border-x transition-colors"
            @pointerdown="handleSplitterPointerDown"
            @pointermove="handleSplitterPointerMove"
            @pointerup="handleSplitterPointerUp"
        />

        <!-- Right pane: Assistant (assistant body + option bar) -->
        <div :class="rightPaneClasses">
            <AssistantPanel :is-wide-display="isWideDisplay" />
            <KnowledgeOptionBar
                class="flex-none"
                :is-open-in-narrow-display="narrowOptionBarOpen === 'assistant'"
                :is-wide-display="isWideDisplay"
                :session-is-authenticated="sessionState.isAuthenticated"
                @select="handleAssistantOptionSelect"
            />
        </div>
    </div>
</template>
