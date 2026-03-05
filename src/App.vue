<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { useColorMode, useMediaQuery } from '@vueuse/core';

// App Core
import type { BenchtopOptionLocalisedConfig } from './types/workbench';
import { useSessionStore } from '@/stores/sessionStore';

// App Components
import ActionButton from '@/components/action/ActionButton.vue';
import DialogWrapper from '@/components/dialog/DialogWrapper.vue';
import DPUseLogoIcon from '@/components/icon/logos/DPUseLogoIcon.vue';
import KnowledgeIcon from '@/components/icon/KnowledgeIcon.vue';
import KnowledgeOptionBar from '@/components/knowledgeOptionBar/KnowledgeOptionBar.vue';
import KnowledgePanel from '@/components/knowledgePanel/KnowledgePanel.vue';
import WorkbenchOptionBar from '@/components/workbenchOptionBar/WorkbenchOptionBar.vue';

// App Components (lazy loaded)
const AcctMgmtDialog = defineAsyncComponent(async () => {
    await new Promise((response) => setTimeout(response, 2000));
    return import('@/components/account/AcctMgmtDialog.vue');
});
const AuthDialog = defineAsyncComponent(async () => {
    await new Promise((response) => setTimeout(response, 2000));
    return import('@/components/session/AuthDialog.vue');
});
const SessionAction = defineAsyncComponent(() => import('@/components/session/SessionAction.vue'));

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

useColorMode(); // CSP requires hash for useColorMode's transition-disabling style. See console error message for required hash.
const route = useRoute();
const sessionState = useSessionStore();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeBenchtopOptionConfig = ref<BenchtopOptionLocalisedConfig | undefined>();
const activeOptionBarId = ref<'none' | 'workbench' | 'knowledge'>('none'); // TODO: Can these be combined. Should we have 'both' for wide display.
const activePaneId = ref<'workbench' | 'knowledge'>('workbench');

// Local State - Display ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const displayIsWide = useMediaQuery('(min-width: 768px)');
watch(displayIsWide, () => (activeOptionBarId.value = 'none'));

// Local State - Dialogs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AcctMgmtDialogIsVisible = computed(() => route.query.dialog === 'acctMgmt');
const authDialogIsVisible = computed(() => route.query.dialog === 'auth');

// Local State - Workbench Pane ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const workbenchPaneIsHidden = ref(false);

const workbenchPaneClasses = computed(() => {
    if (displayIsWide.value) {
        if (workbenchPaneIsHidden.value) return 'hidden';
        return 'flex h-full min-w-0';
    }
    return activePaneId.value === 'workbench' ? 'flex h-full min-w-0 flex-1' : 'h-full w-0 overflow-hidden';
});

const workbenchPaneStyle = computed(() => {
    if (!displayIsWide.value || workbenchPaneIsHidden.value) return {};
    if (knowledgePaneIsHidden.value) return { flex: '1' };
    return { width: paneSplitterPercent.value + '%' };
});

const workbenchPaneToggleAriaLabel = computed(() => {
    if (!displayIsWide.value) return activeOptionBarId.value === 'workbench' ? 'Hide navigation bar' : 'Show navigation bar';
    return workbenchPaneIsHidden.value ? 'Show workbench' : 'Hide workbench';
});

// Local State - Pane Splitter ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const paneSplitterIsDragging = ref(false);

const paneSplitterIsVisible = computed(() => displayIsWide.value && !workbenchPaneIsHidden.value && !knowledgePaneIsHidden.value);

const paneSplitterPercent = ref(50);

// Local State - Knowledge Pane ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const knowledgePaneIsHidden = ref(false);

const knowledgePaneClasses = computed(() => {
    if (displayIsWide.value) {
        if (knowledgePaneIsHidden.value) return 'hidden';
        return 'flex h-full min-w-0 flex-1';
    }
    return activePaneId.value === 'knowledge' ? 'flex h-full min-w-0 flex-1' : 'h-full w-0 overflow-hidden';
});

const knowledgePaneToggleAriaLabel = computed(() => {
    if (!displayIsWide.value) return activeOptionBarId.value === 'knowledge' ? 'Hide knowledge bar' : 'Show knowledge bar';
    return knowledgePaneIsHidden.value ? 'Show knowledge' : 'Hide knowledge';
});

// Lifecycle Event Handlers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(() => sessionState.initialiseServices());

// UI Helpers - Workbench Pane ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleWorkbenchToggle(): void {
    if (displayIsWide.value) {
        // Don't close if it's the only open panel
        if (!workbenchPaneIsHidden.value && knowledgePaneIsHidden.value) return;
        workbenchPaneIsHidden.value = !workbenchPaneIsHidden.value;
        activePaneId.value = workbenchPaneIsHidden.value ? 'knowledge' : 'workbench'; // Pre-set narrow mode active pane for when display switches back.
    } else {
        activeOptionBarId.value = activeOptionBarId.value === 'workbench' ? 'none' : 'workbench';
    }
}

function handleWorkbenchOptionSelect(config?: BenchtopOptionLocalisedConfig): void {
    activeBenchtopOptionConfig.value = config;
    activeOptionBarId.value = 'none';
    activePaneId.value = 'workbench';
}

// UI Helpers - Pane Splitter ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleSplitterPointerDown(event: PointerEvent): void {
    paneSplitterIsDragging.value = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
}

function handleSplitterPointerMove(event: PointerEvent): void {
    if (!paneSplitterIsDragging.value) return;
    const percent = (event.clientX / window.innerWidth) * 100;
    paneSplitterPercent.value = Math.min(Math.max(percent, 20), 80);
}

function handleSplitterPointerUp(): void {
    paneSplitterIsDragging.value = false;
}

// UI Helpers - Knowledge Pane ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleKnowledgeToggle(): void {
    if (displayIsWide.value) {
        // Don't close if it's the only open panel.
        if (!knowledgePaneIsHidden.value && workbenchPaneIsHidden.value) return;
        knowledgePaneIsHidden.value = !knowledgePaneIsHidden.value;
        activePaneId.value = knowledgePaneIsHidden.value ? 'workbench' : 'knowledge'; // Pre-set narrow mode active pane for when display switches back.
    } else {
        activeOptionBarId.value = activeOptionBarId.value === 'knowledge' ? 'none' : 'knowledge';
    }
}

function handleKnowledgeOptionSelect(): void {
    activeOptionBarId.value = 'none';
    activePaneId.value = 'knowledge';
}
</script>

<template>
    <div class="bg-surface text-content fixed inset-0 flex" :class="{ 'select-none': paneSplitterIsDragging }">
        <!-- Workbench toggle fixed in top left corner. Always visible .-->
        <ActionButton :aria-label="workbenchPaneToggleAriaLabel" class="fixed top-1.75 left-3 z-40" variant="iconLarge" @click="handleWorkbenchToggle">
            <DPUseLogoIcon />
        </ActionButton>

        <!-- Knowledge toggle fixed in top right corner. Always visible -->
        <ActionButton :aria-label="knowledgePaneToggleAriaLabel" class="fixed top-1.75 right-3 z-40" variant="iconLarge" @click="handleKnowledgeToggle">
            <KnowledgeIcon />
        </ActionButton>

        <!-- Session action -->
        <SessionAction class="fixed bottom-7 left-3 z-40" :session-is-authenticated="sessionState.isAuthenticated" @click="handleWorkbenchOptionSelect" />

        <!-- Authentication dialog activated using url parameter 'dialog=auth'. -->
        <DialogWrapper v-if="authDialogIsVisible">
            <AuthDialog />
        </DialogWrapper>

        <!-- Account Management dialog activated using url parameter 'dialog=acctMgmt'. -->
        <DialogWrapper v-if="AcctMgmtDialogIsVisible">
            <AcctMgmtDialog :display-is-wide="displayIsWide" />
        </DialogWrapper>

        <!-- Left pane: Workbench (option bar + workbench body). -->
        <div :class="workbenchPaneClasses" :style="workbenchPaneStyle">
            <WorkbenchOptionBar
                class="flex-none"
                :is-open-in-narrow-display="activeOptionBarId === 'workbench'"
                :display-is-wide="displayIsWide"
                :session-is-authenticated="sessionState.isAuthenticated"
                @select="handleWorkbenchOptionSelect"
            />
            <div class="flex-1 overflow-y-hidden">
                <RouterView v-slot="{ Component }">
                    <component :is="Component" :active-benchtop-option-config="activeBenchtopOptionConfig" :display-is-wide="displayIsWide" />
                </RouterView>
            </div>
        </div>

        <!-- Vertical splitter for resizing panes. -->
        <div
            v-if="paneSplitterIsVisible"
            class="border-boundary hover:bg-separator h-full w-1 flex-none cursor-col-resize border-x transition-colors"
            @pointerdown="handleSplitterPointerDown"
            @pointermove="handleSplitterPointerMove"
            @pointerup="handleSplitterPointerUp"
        />

        <!-- Right pane: Knowledge (knowledge body + option bar). -->
        <div :class="knowledgePaneClasses">
            <KnowledgePanel class="flex-1" :display-is-wide="displayIsWide" />
            <KnowledgeOptionBar
                class="flex-none"
                :is-open-in-narrow-display="activeOptionBarId === 'knowledge'"
                :display-is-wide="displayIsWide"
                :session-is-authenticated="sessionState.isAuthenticated"
                @select="handleKnowledgeOptionSelect"
            />
        </div>
    </div>
</template>
