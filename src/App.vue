<script setup lang="ts">
// External Dependencies
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { InfoIcon, LibraryBigIcon, MessageCircleMoreIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// App Core
import { displayIsWide } from '@/state/displayBreakpoint';
import { isBusy } from '@/state/appProgress';
import { load } from '@/utils/component';

// App Components - Statically imported so always available, even after app goes offline.
import AppProgressBar from '@/components/appProgressBar/AppProgressBar.vue'; // Required when lazy loading is delayed.
import BusyMask from '@/components/mask/BusyMask.vue'; // Shown during non-dialog async component loading to prevent duplicate actions.
import Button from '@/components/button/Button.vue'; // Required for workbench and knowledge toggle buttons which are always visible.
import ChunkLoadError from '@/components/chunkLoadError/ChunkLoadError.vue';
import DialogWrapper from '@/components/dialog/DialogWrapper.vue'; // Static so dialog mask appears immediately on open.
import DPUseLogoIcon from '@/components/icon/logos/DPUseLogoIcon.vue'; // Always visible.
import KnowledgeIcon from '@/components/icon/KnowledgeIcon.vue'; // Always visible.
import type { KnowledgeViewId } from '@/domains/knowledge/KnowledgeLayout.vue';
import SessionButton from '@/domains/session/SessionButton.vue'; // Always visible.

// App Components - Lazy loaded as required.
const AccountDialog = defineAsyncComponent({ loader: load('accountDialog', () => import('@/domains/session/accountDialog/AccountDialog.vue'), 0), errorComponent: ChunkLoadError });
const AuthDialog = defineAsyncComponent({ loader: load('authDialog', () => import('@/domains/session/authDialog/AuthDialog.vue'), 0), errorComponent: ChunkLoadError });
const KnowledgeLayout = defineAsyncComponent({ loader: load('knowledgeLayout', () => import('@/domains/knowledge/KnowledgeLayout.vue'), 0), errorComponent: ChunkLoadError });
const PaneSplitter = defineAsyncComponent({ loader: load('paneSplitter', () => import('@/components/paneSplitter/PaneSplitter.vue'), 0), errorComponent: ChunkLoadError });
const WorkbenchOptionBar = defineAsyncComponent({
    loader: load('workbenchOptionBar', () => import('@/domains/workbench/WorkbenchOptionBar.vue'), 0),
    errorComponent: ChunkLoadError
});

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PANE_SPLITTER_PERCENT_KEY = 'dpuse-paneSplitterPercent';

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type AppPaneId = 'workbench' | 'knowledge';
const activeAppPaneId = ref<AppPaneId | undefined>();

const knowledgeOptionBarIsVisible = ref(false);
const knowledgePaneActivated = ref(false); // Keeps the component alive so it doesn't lose its internal state when hidden.
const knowledgePaneIsActive = ref(false); // On narrow displays a pane can be active but not visible.
const knowledgePaneIsVisible = ref(false); // The pane is actually rendered in the layout right now.

const paneSplitterPercent = ref(Number(localStorage.getItem(PANE_SPLITTER_PERCENT_KEY)) || 50);

const route = useRoute();
const router = useRouter();

const workbenchOptionBarIsVisible = ref(false);
const workbenchPaneActivated = ref(false); // Keeps the component alive so it doesn't lose its internal state when hidden.
const workbenchPaneIsActive = ref(false); // On narrow displays a pane can be active but not visible.
const workbenchPaneIsVisible = ref(false); // The pane is actually rendered in the layout right now.

// Derived State - Dialogs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const accountDialogIsVisible = computed(() => route.query.dlg === 'account');
const authDialogIsVisible = computed(() => route.query.dlg === 'auth');

// Derived State - Panes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const knowledgePaneStyle = computed(() => {
    if (knowledgePaneIsVisible.value) return { minWidth: '0', flex: '1' };
    return { width: '0' };
});

const paneSplitterIsVisible = computed(() => workbenchPaneIsVisible.value && knowledgePaneIsVisible.value);

const workbenchPaneStyle = computed(() => {
    if (!workbenchPaneIsVisible.value) return { width: '0' };
    if (knowledgePaneIsVisible.value) return { minWidth: '0', width: paneSplitterPercent.value + '%' };
    return { minWidth: '0', flex: '1' };
});

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router
    .isReady()
    .then(() => {
        workbenchPaneActivated.value = workbenchPaneIsActive.value = route.path !== '/';
        knowledgePaneActivated.value = knowledgePaneIsActive.value = route.query.kState === '1' && 'kView' in route.query;
        activeAppPaneId.value = workbenchPaneActivated.value ? 'workbench' : 'knowledge';
        establishActiveAppPaneId(displayIsWide.value);
    })
    .catch(() => {
        // Router failed to initialise — fall back to showing the workbench pane.
        workbenchPaneActivated.value = workbenchPaneIsActive.value = workbenchPaneIsVisible.value = true;
        knowledgePaneActivated.value = knowledgePaneIsActive.value = knowledgePaneIsVisible.value = false;
        activeAppPaneId.value = 'workbench';
    });

onMounted(() => import('@/state/session').then((module) => module.initialiseServices()));

watch(displayIsWide, (newDisplayIsWide) => {
    if (activeAppPaneId.value != null) establishActiveAppPaneId(newDisplayIsWide);
});

watch(paneSplitterPercent, (newPaneSplitterPercent) => localStorage.setItem(PANE_SPLITTER_PERCENT_KEY, String(newPaneSplitterPercent)));

// UI Helpers - Option Bars ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function closeOptionBarOnNarrowDisplay(): void {
    if (displayIsWide.value) return;
    knowledgeOptionBarIsVisible.value = false;
    workbenchOptionBarIsVisible.value = false;
}

// UI Helpers - Panes - Knowledge  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function toggleKnowledgeAppPane(): void {
    if (displayIsWide.value) {
        if (knowledgePaneIsVisible.value && !workbenchPaneIsVisible.value) return; // Don't close the knowledge pane if it's the only one visible.
        applyKnowledgePaneToggle();
        activeAppPaneId.value = knowledgePaneIsVisible.value ? 'knowledge' : 'workbench';
        return;
    }

    // Display is narrow, pane already visible — toggle its option bar.
    if (knowledgePaneIsVisible.value) {
        knowledgeOptionBarIsVisible.value = !knowledgeOptionBarIsVisible.value;
        return;
    }

    // Display is narrow, switching to this pane — close other option bar first if open.
    activeAppPaneId.value = 'knowledge';
    workbenchOptionBarIsVisible.value = false;
    workbenchPaneIsVisible.value = false;
    applyKnowledgePaneToggle();
}

function applyKnowledgePaneToggle(): void {
    if ('kView' in route.query) {
        // Then - toggle knowledge pane, ensure knowledge pane is activated (may be first time), and update route properties.
        knowledgePaneIsActive.value = knowledgePaneIsVisible.value = !knowledgePaneIsVisible.value;
        if (knowledgePaneIsActive.value) knowledgePaneActivated.value = true;
        router.replace({ query: { ...route.query, wbState: workbenchPaneIsVisible.value ? 1 : undefined, kState: knowledgePaneIsVisible.value ? 1 : undefined } });
    } else {
        // Else - knowledge pane has never been activated, active and navigate to last 'about' route.
        knowledgePaneActivated.value = knowledgePaneIsActive.value = knowledgePaneIsVisible.value = true;
        router.replace({ query: { ...route.query, kView: 'about', wbState: workbenchPaneIsVisible.value ? 1 : undefined, kState: 1 } });
    }
}

// UI Helpers - Panes - Workbench ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function selectKnowledgePanel(knowledgeViewId: KnowledgeViewId): void {
    activeAppPaneId.value = 'knowledge';
    knowledgePaneIsActive.value = knowledgePaneIsVisible.value = route.query.kView !== knowledgeViewId || knowledgePaneIsVisible.value !== true;
    if (knowledgePaneIsActive.value) knowledgePaneActivated.value = true;
    router.replace({ query: { ...route.query, kState: knowledgePaneIsVisible.value ? 1 : undefined, kView: knowledgeViewId } });
    knowledgeOptionBarIsVisible.value = false;
}

function toggleWorkbenchAppPane(): void {
    if (displayIsWide.value) {
        if (workbenchPaneIsVisible.value && !knowledgePaneIsVisible.value) return; // Don't close the workbench pane if it's the only one visible.
        applyWorkbenchPaneToggle();
        activeAppPaneId.value = workbenchPaneIsVisible.value ? 'workbench' : 'knowledge';
        return;
    }

    // Display is narrow, pane already visible — toggle its option bar.
    if (workbenchPaneIsVisible.value) {
        workbenchOptionBarIsVisible.value = !workbenchOptionBarIsVisible.value;
        return;
    }

    // Display is narrow, switching to this pane — close other option bar first if open.
    activeAppPaneId.value = 'workbench';
    knowledgeOptionBarIsVisible.value = false;
    knowledgePaneIsVisible.value = false;
    applyWorkbenchPaneToggle();
}

function applyWorkbenchPaneToggle(): void {
    if (route.path === '/') {
        // Then - workbench pane has never been activated, active and navigate to last know route.
        workbenchPaneActivated.value = workbenchPaneIsActive.value = workbenchPaneIsVisible.value = true;
        router.replace({
            name: (Array.isArray(route.query.wbView) ? route.query.wbView[0] : route.query.wbView) ?? 'workflow',
            query: { ...route.query, wbState: 1, kState: knowledgePaneIsVisible.value ? 1 : undefined }
        });
    } else {
        // Else - toggle workbench pane and update route properties.
        workbenchPaneIsActive.value = workbenchPaneIsVisible.value = !workbenchPaneIsVisible.value;
        router.replace({ query: { ...route.query, wbState: workbenchPaneIsVisible.value ? 1 : undefined, kState: knowledgePaneIsVisible.value ? 1 : undefined } });
    }
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function establishActiveAppPaneId(displayIsWide: boolean): void {
    if (displayIsWide) {
        workbenchPaneIsVisible.value = workbenchPaneIsActive.value;
        knowledgePaneIsVisible.value = knowledgePaneIsActive.value;
    } else {
        workbenchPaneIsVisible.value = workbenchPaneIsActive.value && activeAppPaneId.value === 'workbench';
        knowledgePaneIsVisible.value = knowledgePaneIsActive.value && activeAppPaneId.value === 'knowledge';
    }
}
</script>

<template>
    <div class="bg-surface text-content fixed inset-0 flex pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
        <div class="to-surface/85 fixed inset-x-0 top-0 h-[env(safe-area-inset-top)] bg-linear-to-t from-transparent" />

        <!-- Navigation progress bar. Always visible. -->
        <AppProgressBar />

        <!-- Busy mask - shown during non-dialog async component loading to prevent duplicate actions. -->
        <BusyMask v-if="isBusy" />

        <!-- Workbench toggle fixed in top left corner. Always visible. -->
        <Button
            aria-label="Toggle workbench panel"
            class="bg-surface fixed top-[calc(env(safe-area-inset-top)+7px)] left-3 z-40 rounded-full! shadow-md"
            variant="iconLarge"
            @click="toggleWorkbenchAppPane()"
        >
            <DPUseLogoIcon />
        </Button>

        <!-- Knowledge toggle fixed in top right corner. Always visible. -->
        <div class="fixed top-[calc(env(safe-area-inset-top)+7px)] right-3 z-40 flex">
            <nav v-if="displayIsWide || knowledgeOptionBarIsVisible">
                <Button aria-label="Select knowledge about panel" variant="iconLarge" @click="selectKnowledgePanel('about')">
                    <InfoIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>

                <Button aria-label="Select knowledge library panel" variant="iconLarge" @click="selectKnowledgePanel('library')">
                    <LibraryBigIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>

                <Button aria-label="Select knowledge chat panel" variant="iconLarge" @click="selectKnowledgePanel('chat')">
                    <MessageCircleMoreIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>
            </nav>

            <!-- <Button :disabled="!workbenchPaneIsVisible" variant="iconLarge" @click="toggleKnowledgeAppPane()"> -->
            <Button aria-label="Toggle knowledge panel" class="bg-surface rounded-full! shadow-md" variant="iconLarge" @click="toggleKnowledgeAppPane()">
                <KnowledgeIcon />
            </Button>
        </div>

        <!-- Session button - always visible, independent of pane state -->
        <div class="fixed bottom-6 left-3 z-40">
            <SessionButton :workbench-option-bar-is-visible="workbenchOptionBarIsVisible" />
        </div>

        <!-- Authentication dialog activated using url parameter 'dlg=auth'. -->
        <Transition name="dialog">
            <DialogWrapper v-if="authDialogIsVisible">
                <AuthDialog />
            </DialogWrapper>
        </Transition>

        <!-- Account dialog activated using url parameter 'dlg=account'. -->
        <Transition name="dialog">
            <DialogWrapper v-if="accountDialogIsVisible">
                <AccountDialog />
            </DialogWrapper>
        </Transition>

        <!-- Workbench option bar - narrow display overlay, rendered at top level so it's accessible regardless of whether the workbench pane is active. -->
        <WorkbenchOptionBar v-if="!displayIsWide && workbenchOptionBarIsVisible" @continue="closeOptionBarOnNarrowDisplay()" />

        <!-- Left Pane - Workbench option bar (wide only) and panel. -->
        <main
            v-if="workbenchPaneActivated"
            v-show="workbenchPaneIsVisible"
            class="grid h-full"
            :class="displayIsWide ? 'grid-cols-[65px_1fr]' : 'grid-cols-1'"
            :style="workbenchPaneStyle"
            @pointerdown="activeAppPaneId = 'workbench'"
            @scroll.capture="activeAppPaneId = 'workbench'"
        >
            <div v-if="displayIsWide" class="border-boundary bg-backdrop h-full border-r">
                <WorkbenchOptionBar @continue="closeOptionBarOnNarrowDisplay()" />
            </div>

            <div class="overflow-y-hidden">
                <RouterView v-slot="{ Component }">
                    <Transition name="fade" mode="out-in">
                        <component :is="Component" :key="$route.matched.find((r) => r.components?.default)?.path" />
                    </Transition>
                </RouterView>
            </div>
        </main>

        <!-- Vertical Splitter - Only visible if display is wide and both panes are visible. -->
        <PaneSplitter v-if="paneSplitterIsVisible" v-model="paneSplitterPercent" />

        <!-- Right Pane - Knowledge panel and option bar (wide only). -->
        <div
            v-if="knowledgePaneActivated"
            v-show="knowledgePaneIsVisible"
            class="flex h-full"
            :style="knowledgePaneStyle"
            @pointerdown="activeAppPaneId = 'knowledge'"
            @scroll.capture="activeAppPaneId = 'knowledge'"
        >
            <KnowledgeLayout class="flex-1" :workbench-pane-is-hidden="!workbenchPaneIsVisible" />
        </div>
    </div>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
    transition: opacity 0.15s ease;
}

.dialog-enter-from,
.dialog-leave-to {
    opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
