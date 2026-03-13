<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { computed, defineAsyncComponent, reactive, ref, watch } from 'vue';

// App Core
import T from '@/locales/App.json';
import { t } from '@/locales';
import { useDisplayBreakpoint } from '@/composables/useDisplayBreakpoint';

// App Components
import Button from '@/components/button/Button.vue'; // Required for workbench and knowledge toggle buttons which are always visible.
import DPUseLogoIcon from '@/components/icon/logos/DPUseLogoIcon.vue'; // Always visible.
import KnowledgeIcon from '@/components/icon/KnowledgeIcon.vue'; // Always visible.

// App Components (lazy loaded)
const AcctMgmtDialog = defineAsyncComponent(() => new Promise((r) => setTimeout(r, 0)).then(() => import('@/components/account/AcctMgmtDialog.vue')));
const AuthDialog = defineAsyncComponent(() => new Promise((r) => setTimeout(r, 0)).then(() => import('@/components/session/AuthDialog.vue')));
const DialogWrapper = defineAsyncComponent(() => import('@/components/dialog/DialogWrapper.vue'));
const KnowledgeOptionBar = defineAsyncComponent(() => import('@/components/knowledgeOptionBar/KnowledgeOptionBar.vue'));
const KnowledgePanel = defineAsyncComponent(() => import('@/components/knowledgePanel/KnowledgePanel.vue'));
const WorkbenchOptionBar = defineAsyncComponent(() => import('@/components/workbenchOptionBar/WorkbenchOptionBar.vue'));
const SessionButton = defineAsyncComponent(() => import('@/components/session/SessionButton.vue'));

// Composables ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { displayIsWide } = useDisplayBreakpoint();
const route = useRoute();

// Local Reactive States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeOptionBarId = ref<'none' | 'workbench' | 'knowledge'>('none');
const paneState = reactive({ workbenchIsHidden: false, knowledgeIsHidden: false, activePaneId: 'workbench' as 'workbench' | 'knowledge' });

// Local Derived States - Dialogs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const acctMgmtDialogIsVisible = computed(() => route.query.dialog === 'acctMgmt');
const authDialogIsVisible = computed(() => route.query.dialog === 'auth');

// Local Derived State - Panes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const workbenchPaneClasses = computed(() => {
    if (displayIsWide.value) {
        if (paneState.workbenchIsHidden) return 'hidden';
        return 'flex h-full min-w-0';
    }
    return paneState.activePaneId === 'workbench' ? 'flex h-full min-w-0 flex-1' : 'h-full w-0 overflow-hidden';
});

const workbenchPaneStyle = computed(() => {
    if (displayIsWide.value && !paneState.workbenchIsHidden) {
        if (paneState.knowledgeIsHidden) return { flex: '1' };
        return { width: paneSplitterPercent.value + '%' };
    }
    return {};
});

// Local Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

watch(displayIsWide, () => (activeOptionBarId.value = 'none'));

// States - Pane Splitter ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const paneSplitterIsDragging = ref(false);
const paneSplitterIsVisible = computed(() => displayIsWide.value && !paneState.workbenchIsHidden && !paneState.knowledgeIsHidden);
const paneSplitterPercent = ref(50);

const knowledgePaneClasses = computed(() => {
    if (displayIsWide.value) {
        if (paneState.knowledgeIsHidden) return 'hidden';
        return 'flex h-full min-w-0 flex-1';
    }
    return paneState.activePaneId === 'knowledge' ? 'flex h-full min-w-0 flex-1' : 'h-full w-0 overflow-hidden';
});

// UI Helpers - Options ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function completeOptionInvocation(paneId: 'workbench' | 'knowledge'): void {
    activeOptionBarId.value = 'none';
    paneState.activePaneId = paneId;
}

// UI Helpers - Panes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function constructPaneToggleAriaLabel(pane: 'workbench' | 'knowledge'): string {
    if (displayIsWide.value) {
        const isHidden = pane === 'workbench' ? paneState.workbenchIsHidden : paneState.knowledgeIsHidden;
        return t(T, isHidden ? `toggle.${pane}.wide.show` : `toggle.${pane}.wide.hide`);
    }
    const isOpen = activeOptionBarId.value === pane;
    return t(T, isOpen ? `toggle.${pane}.narrow.hide` : `toggle.${pane}.narrow.show`);
}

function togglePane(pane: 'workbench' | 'knowledge'): void {
    if (displayIsWide.value) {
        const isHiddenKey = pane === 'workbench' ? 'workbenchIsHidden' : 'knowledgeIsHidden';
        const otherIsHiddenKey = pane === 'workbench' ? 'knowledgeIsHidden' : 'workbenchIsHidden';
        if (!paneState[isHiddenKey] && paneState[otherIsHiddenKey]) return;
        paneState[isHiddenKey] = !paneState[isHiddenKey];
        paneState.activePaneId = paneState[isHiddenKey] ? (pane === 'workbench' ? 'knowledge' : 'workbench') : pane; // Pre-set narrow mode active pane for when display switches back.
    } else {
        activeOptionBarId.value = activeOptionBarId.value === pane ? 'none' : pane;
    }
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
</script>

<template>
    <div class="bg-surface text-content fixed inset-0 flex" :class="{ 'select-none': paneSplitterIsDragging }">
        <!-- Workbench toggle fixed in top left corner. Always visible .-->
        <Button :aria-label="constructPaneToggleAriaLabel('workbench')" class="fixed top-1.75 left-3 z-40" variant="iconLarge" @click="togglePane('workbench')">
            <DPUseLogoIcon />
        </Button>

        <!-- Knowledge toggle fixed in top right corner. Always visible -->
        <Button :aria-label="constructPaneToggleAriaLabel('knowledge')" class="fixed top-1.75 right-3 z-40" variant="iconLarge" @click="togglePane('knowledge')">
            <KnowledgeIcon />
        </Button>

        <!-- Session action -->
        <Transition appear name="horizontal-slide-ltr">
            <div v-if="displayIsWide || activeOptionBarId === 'workbench'" class="fixed bottom-7 left-3 z-40">
                <SessionButton class="dpuse-horizontal-slide-ltr-element" @continue="completeOptionInvocation('workbench')" />
            </div>
        </Transition>

        <!-- Authentication dialog activated using url parameter 'dialog=auth'. -->
        <DialogWrapper v-if="authDialogIsVisible">
            <AuthDialog />
        </DialogWrapper>

        <!-- Account Management dialog activated using url parameter 'dialog=acctMgmt'. -->
        <DialogWrapper v-if="acctMgmtDialogIsVisible">
            <AcctMgmtDialog />
        </DialogWrapper>

        <!-- Left pane: Workbench (option bar + workbench body). -->
        <div :class="workbenchPaneClasses" :style="workbenchPaneStyle">
            <WorkbenchOptionBar class="flex-none" :is-open-in-narrow-display="activeOptionBarId === 'workbench'" @continue="completeOptionInvocation('workbench')" />
            <div class="flex-1 overflow-y-hidden">
                <RouterView v-slot="{ Component }">
                    <Transition name="fade" mode="out-in">
                        <component :is="Component" :key="$route.path" />
                    </Transition>
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
            <KnowledgePanel class="flex-1" :workbench-pane-is-hidden="paneState.workbenchIsHidden" />
            <KnowledgeOptionBar class="flex-none" :is-open-in-narrow-display="activeOptionBarId === 'knowledge'" @continue="completeOptionInvocation('knowledge')" />
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
