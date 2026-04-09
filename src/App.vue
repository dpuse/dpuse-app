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
import WorkbenchOptionBarSkeleton from '@/components/workbenchOptionBar/WorkbenchOptionBarSkeleton.vue'; // Reserves sidebar space on wide displays while chunk loads.

// App Components - Lazy loaded as required.
// const KnowledgeOptionBar = defineAsyncComponent({ loader: load('knowledgeOptionBar', () => import('@/components/knowledgeOptionBar/KnowledgeOptionBar.vue')), errorComponent: ChunkLoadError });
const AccountDialog = defineAsyncComponent({ loader: load('accountDialog', () => import('@/domains/session/accountDialog/AccountDialog.vue'), 0), errorComponent: ChunkLoadError });
const AuthDialog = defineAsyncComponent({ loader: load('authDialog', () => import('@/domains/session/authDialog/AuthDialog.vue'), 0), errorComponent: ChunkLoadError });
const KnowledgeLayout = defineAsyncComponent({ loader: load('knowledgeLayout', () => import('@/domains/knowledge/KnowledgeLayout.vue'), 0), errorComponent: ChunkLoadError });
const PaneSplitter = defineAsyncComponent({ loader: load('paneSplitter', () => import('@/components/paneSplitter/PaneSplitter.vue'), 0), errorComponent: ChunkLoadError });
const WorkbenchOptionBar = defineAsyncComponent({
    loader: load('workbenchOptionBar', () => import('@/components/workbenchOptionBar/WorkbenchOptionBar.vue'), 0),
    loadingComponent: WorkbenchOptionBarSkeleton,
    delay: 0,
    errorComponent: ChunkLoadError
});

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type AppPaneId = 'workbench' | 'knowledge';
const activeAppPaneId = ref<AppPaneId | undefined>();

const knowledgeOptionBarIsVisible = ref(false);
const knowledgePaneActivated = ref(false); // Keeps the component alive so it doesn't lose its internal state when hidden.
const knowledgePaneIsActive = ref(false); // On narrow displays a pane can be active but not visible.
const knowledgePaneIsVisible = ref(false); // The pane is actually rendered in the layout right now.

const paneSplitterPercent = ref(50);

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

watch(displayIsWide, (newDisplayIsWide) => establishActiveAppPaneId(newDisplayIsWide));

// UI Helpers - Options ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function closeOptionBarOnNarrowDisplay(): void {
    if (!displayIsWide.value) {
        knowledgeOptionBarIsVisible.value = false;
        workbenchOptionBarIsVisible.value = false;
    }
}

// UI Helpers - Panes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function selectKnowledgePanel(knowledgeViewId: KnowledgeViewId): void {
    knowledgePaneIsActive.value = knowledgePaneIsVisible.value = route.query.kView !== knowledgeViewId || knowledgePaneIsVisible.value !== true;
    if (knowledgePaneIsActive.value) knowledgePaneActivated.value = true;
    router.replace({ query: { ...route.query, kState: knowledgePaneIsVisible.value ? 1 : undefined, kView: knowledgeViewId } });
    knowledgeOptionBarIsVisible.value = false;
}

function toggleWorkbenchAppPane(): void {
    if (displayIsWide.value) {
        // Don't close the workbench pane if it's the only one visible.
        if (workbenchPaneIsVisible.value && !knowledgePaneIsVisible.value) return;
        applyWorkbenchPaneToggle();
        // if (workbenchPaneIsVisible.value) {
        //     activeAppPaneId.value = 'workbench';
        // } else if (activeAppPaneId.value === 'workbench') {
        //     // The active pane was just closed — point to whichever pane is still open.
        //     activeAppPaneId.value = 'knowledge';
        // }
        activeAppPaneId.value = workbenchPaneIsVisible.value ? 'workbench' : 'knowledge';
        return;
    }

    // Narrow: pane already visible — toggle its option bar.
    if (workbenchPaneIsVisible.value) {
        workbenchOptionBarIsVisible.value = !workbenchOptionBarIsVisible.value;
        return;
    }

    // Narrow: switching to this pane — close other option bar first if open.
    activeAppPaneId.value = 'workbench';
    if (knowledgeOptionBarIsVisible.value) {
        knowledgeOptionBarIsVisible.value = false;
        return;
    }
    knowledgePaneIsVisible.value = false;
    applyWorkbenchPaneToggle();
}

function applyWorkbenchPaneToggle(): void {
    if (route.path === '/') {
        workbenchPaneActivated.value = workbenchPaneIsActive.value = workbenchPaneIsVisible.value = true;
        router.replace({
            name: (Array.isArray(route.query.wbView) ? route.query.wbView[0] : route.query.wbView) ?? 'workflow',
            query: { ...route.query, wbState: workbenchPaneIsVisible.value ? 1 : undefined, kState: knowledgePaneIsVisible.value ? 1 : undefined }
        });
    } else {
        workbenchPaneIsActive.value = workbenchPaneIsVisible.value = !workbenchPaneIsVisible.value;
        if (workbenchPaneIsActive.value) workbenchPaneActivated.value = true;
        router.replace({ query: { ...route.query, wbState: workbenchPaneIsVisible.value ? 1 : undefined, kState: knowledgePaneIsVisible.value ? 1 : undefined } });
    }
}

function toggleKnowledgeAppPane(): void {
    if (displayIsWide.value) {
        // Don't close the knowledge pane if it's the only one visible.
        if (knowledgePaneIsVisible.value && !workbenchPaneIsVisible.value) return;
        applyKnowledgePaneToggle();
        // if (knowledgePaneIsVisible.value) {
        //     activeAppPaneId.value = 'knowledge';
        // } else if (activeAppPaneId.value === 'knowledge') {
        //     // The active pane was just closed — point to whichever pane is still open.
        //     activeAppPaneId.value = 'workbench';
        // }
        activeAppPaneId.value = knowledgePaneIsVisible.value ? 'knowledge' : 'workbench';
        return;
    }

    // Narrow: pane already visible — toggle its option bar.
    if (knowledgePaneIsVisible.value) {
        knowledgeOptionBarIsVisible.value = !knowledgeOptionBarIsVisible.value;
        return;
    }

    // Narrow: switching to this pane — close other option bar first if open.
    activeAppPaneId.value = 'knowledge';
    if (workbenchOptionBarIsVisible.value) {
        workbenchOptionBarIsVisible.value = false;
        return;
    }
    workbenchPaneIsVisible.value = false;
    applyKnowledgePaneToggle();
}

function applyKnowledgePaneToggle(): void {
    if ('kView' in route.query) {
        knowledgePaneIsActive.value = knowledgePaneIsVisible.value = !knowledgePaneIsVisible.value;
        if (knowledgePaneIsActive.value) knowledgePaneActivated.value = true;
        router.replace({ query: { ...route.query, wbState: workbenchPaneIsVisible.value ? 1 : undefined, kState: knowledgePaneIsVisible.value ? 1 : undefined } });
    } else {
        knowledgePaneActivated.value = knowledgePaneIsActive.value = knowledgePaneIsVisible.value = true;
        router.replace({ query: { ...route.query, kView: 'about', wbState: workbenchPaneIsVisible.value ? 1 : undefined, kState: knowledgePaneIsVisible.value ? 1 : undefined } });
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
    <div class="bg-surface text-content fixed inset-0 flex">
        <div class="bg-surface/85 fixed inset-x-0 top-0 h-[env(safe-area-inset-top)] backdrop-blur-[3px]" />

        <!-- Navigation progress bar. Always visible. -->
        <AppProgressBar />

        <!-- Busy mask - shown during non-dialog async component loading to prevent duplicate actions. -->
        <BusyMask v-if="isBusy" />

        <!-- Workbench toggle fixed in top left corner. Always visible. -->
        <Button class="fixed top-[calc(env(safe-area-inset-top)+7px)] left-3 z-40" variant="iconLarge" @click="toggleWorkbenchAppPane()">
            <DPUseLogoIcon />
        </Button>

        <!-- Knowledge toggle fixed in top right corner. Always visible. -->
        <div class="fixed top-[calc(env(safe-area-inset-top)+7px)] right-3 z-40 flex">
            <div v-if="displayIsWide || knowledgeOptionBarIsVisible">
                <Button variant="iconLarge" @click="selectKnowledgePanel('about')">
                    <InfoIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>

                <Button variant="iconLarge" @click="selectKnowledgePanel('library')">
                    <LibraryBigIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>

                <Button variant="iconLarge" @click="selectKnowledgePanel('chat')">
                    <MessageCircleMoreIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>
            </div>

            <!-- <Button :disabled="!workbenchPaneIsVisible" variant="iconLarge" @click="toggleKnowledgeAppPane()"> -->
            <Button variant="iconLarge" @click="toggleKnowledgeAppPane()">
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
        <div
            v-if="workbenchPaneActivated"
            v-show="workbenchPaneIsVisible"
            class="flex h-full"
            :style="workbenchPaneStyle"
            @pointerdown="activeAppPaneId = 'workbench'"
            @scroll.capture="activeAppPaneId = 'workbench'"
        >
            <WorkbenchOptionBar v-if="displayIsWide" class="flex-none" :is-open-in-narrow-display="false" @continue="closeOptionBarOnNarrowDisplay()" />
            <div class="flex-1 overflow-y-hidden">
                <RouterView v-slot="{ Component }">
                    <Transition name="fade" mode="out-in">
                        <component :is="Component" :key="$route.matched.find((r) => r.components?.default)?.path" />
                    </Transition>
                </RouterView>
            </div>
        </div>

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
            <!-- <KnowledgeOptionBar v-if="displayIsWide" class="flex-none" :is-open-in-narrow-display="false" @continue="closeOptionBarOnNarrowDisplay('knowledge')" /> -->
        </div>

        <!-- Knowledge option bar - narrow display overlay, rendered at top level so it's accessible regardless of whether the knowledge pane is active. -->
        <!-- <KnowledgeOptionBar
            v-if="!displayIsWide && knowledgeOptionBarInitialised"
            :is-open-in-narrow-display="knowledgeOptionBarIsVisible"
            @continue="closeOptionBarOnNarrowDisplay('knowledge')"
        /> -->
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
