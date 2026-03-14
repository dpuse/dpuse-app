<script setup lang="ts">
// External Dependencies
import { useRouter } from 'vue-router';
import { computed, defineAsyncComponent, ref, watch } from 'vue';

// App Core
import T from '@/locales/App.json';
import { t } from '@/locales';
import { useDisplayBreakpoint } from '@/composables/useDisplayBreakpoint';

// App Components
import Button from '@/components/button/Button.vue'; // Required for workbench and knowledge toggle buttons which are always visible.
import DPUseLogoIcon from '@/components/icon/logos/DPUseLogoIcon.vue'; // Always visible.
import KnowledgeIcon from '@/components/icon/KnowledgeIcon.vue'; // Always visible.
import NavProgressBar from '@/components/navProgressBar/NavProgressBar.vue'; // Always visible.

// App Components - Lazy Loaded
const AcctMgmtDialog = defineAsyncComponent(() => new Promise((r) => setTimeout(r, 0)).then(() => import('@/components/account/AcctMgmtDialog.vue')));
const AuthDialog = defineAsyncComponent(() => new Promise((r) => setTimeout(r, 0)).then(() => import('@/components/session/AuthDialog.vue')));
const DialogWrapper = defineAsyncComponent(() => import('@/components/dialog/DialogWrapper.vue'));
const KnowledgeOptionBar = defineAsyncComponent(() => import('@/components/knowledgeOptionBar/KnowledgeOptionBar.vue'));
const KnowledgePanel = defineAsyncComponent(() => import('@/components/knowledgePanel/KnowledgePanel.vue'));
const PaneSplitter = defineAsyncComponent(() => import('@/components/paneSplitter/PaneSplitter.vue'));
const SessionButton = defineAsyncComponent(() => import('@/components/session/SessionButton.vue'));
const WorkbenchOptionBar = defineAsyncComponent(() => import('@/components/workbenchOptionBar/WorkbenchOptionBar.vue'));

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { displayIsWide } = useDisplayBreakpoint();
const router = useRouter();

// Local Reactive State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeOptionBarId = ref<'workbench' | 'knowledge' | undefined>(undefined);
const activePaneId = ref<'workbench' | 'knowledge'>(router.currentRoute.value.path === '/' ? 'knowledge' : 'workbench');
const paneSplitterPercent = ref(50);

// Local Derived State - Dialogs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const acctMgmtDialogIsVisible = computed(() => router.currentRoute.value.query.dialog === 'acctMgmt');
const authDialogIsVisible = computed(() => router.currentRoute.value.query.dialog === 'auth');

// Local Derived State - Panes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const showWorkbench = computed(() => router.currentRoute.value.path !== '/');
const showKnowledge = computed(() => 'knowledge' in router.currentRoute.value.query);

const knowledgePaneClasses = computed(() => {
    if (displayIsWide.value) return 'flex h-full min-w-0 flex-1';
    return activePaneId.value === 'knowledge' ? 'flex h-full min-w-0 flex-1' : 'h-full w-0 overflow-hidden';
});

const paneSplitterIsVisible = computed(() => displayIsWide.value && showWorkbench.value && showKnowledge.value);

const workbenchPaneClasses = computed(() => {
    if (displayIsWide.value) return 'flex h-full min-w-0';
    return activePaneId.value === 'workbench' ? 'flex h-full min-w-0 flex-1' : 'h-full w-0 overflow-hidden';
});

const workbenchPaneStyle = computed(() => {
    if (displayIsWide.value) {
        if (!showKnowledge.value) return { flex: '1' };
        return { width: paneSplitterPercent.value + '%' };
    }
    return {};
});

// Local Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

watch(displayIsWide, () => (activeOptionBarId.value = undefined));

// UI Helpers - Options ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function completeOptionInvocation(paneId: 'workbench' | 'knowledge'): void {
    activeOptionBarId.value = undefined;
    activePaneId.value = paneId;
}

// UI Helpers - Panes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function constructPaneToggleAriaLabel(pane: 'workbench' | 'knowledge'): string {
    if (displayIsWide.value) {
        const isHidden = pane === 'workbench' ? !showWorkbench.value : !showKnowledge.value;
        return t(T, isHidden ? `toggle.${pane}.wide.show` : `toggle.${pane}.wide.hide`);
    }
    const isOpen = activeOptionBarId.value === pane;
    return t(T, isOpen ? `toggle.${pane}.narrow.hide` : `toggle.${pane}.narrow.show`);
}

async function togglePane(pane: 'workbench' | 'knowledge'): Promise<void> {
    if (displayIsWide.value) {
        if (pane === 'workbench') {
            if (showWorkbench.value) {
                if (!showKnowledge.value) return; // Can't hide the only visible pane.
                await router.push({ path: '/', query: { ...router.currentRoute.value.query } });
            } else {
                await router.push({ path: '/workflow', query: router.currentRoute.value.query });
            }
        } else {
            if (showKnowledge.value) {
                if (!showWorkbench.value) return; // Can't hide the only visible pane.
                const query = Object.fromEntries(Object.entries(router.currentRoute.value.query).filter(([k]) => k !== 'knowledge'));
                await router.push({ path: router.currentRoute.value.path, query });
            } else {
                await router.push({ path: router.currentRoute.value.path, query: { ...router.currentRoute.value.query, knowledge: 'welcome' } });
            }
        }
    } else {
        const paneIsShown = pane === 'workbench' ? showWorkbench.value : showKnowledge.value;
        if (paneIsShown) {
            activeOptionBarId.value = activeOptionBarId.value === pane ? undefined : pane;
        } else {
            await (pane === 'workbench'
                ? router.push({ path: '/workflow', query: router.currentRoute.value.query })
                : router.push({ path: router.currentRoute.value.path, query: { ...router.currentRoute.value.query, knowledge: 'welcome' } }));
        }
    }
}
</script>

<template>
    <div class="bg-surface text-content fixed inset-0 flex">
        <!-- Navigation progress bar. Always visible. -->
        <NavProgressBar />

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
        <div v-if="showWorkbench" :class="workbenchPaneClasses" :style="workbenchPaneStyle">
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
        <PaneSplitter v-if="paneSplitterIsVisible" v-model="paneSplitterPercent" />

        <!-- Right pane: Knowledge (knowledge body + option bar). -->
        <div v-if="showKnowledge" :class="knowledgePaneClasses">
            <KnowledgePanel class="flex-1" :workbench-pane-is-hidden="!showWorkbench" />
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
