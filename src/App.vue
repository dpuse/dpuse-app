<script setup lang="ts">
// External Dependencies
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { InfoIcon, LibraryBigIcon, MessageCircleMoreIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// Local (App) Framework
import { buildLoadOptions } from '@/utils/component';
import { initialiseServices } from '@/state/session';
import T from './App.json';
import { t } from '@/state/locale';
import { busyLoadingState, navLoadingState } from '@/state/appProgress';
import { contentScrollPosition, knowledgePaneIsVisible, viewportIsWide, workbenchPaneIsVisible } from '@/state/appLayout';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue'; // Required for workbench and knowledge toggle buttons which are always visible.
import DialogLayout from '@/components/ui/dialog/DialogLayout.vue'; // Static so dialog mask appears immediately on open.
import DPUseLogo from '@/components/branding/DPUseLogo.vue'; // Always visible.
import KnowledgeLogo from '@/components/branding/KnowledgeLogo.vue'; // Always visible.
import type { KnowledgeViewId } from '@/domains/knowledge/KnowledgeLayout.vue';
import LoadingMask from '@/components/framework/LoadingMask.vue'; // Shown during route component loading — transparent blocker immediately, visible overlay when progress bar shows.
import ProgressBar from '@/components/framework/ProgressBar.vue'; // Required when lazy loading is delayed.
import SessionButton from '@/domains/session/SessionButton.vue'; // Always visible.

// Local Components - Dynamic
const AccountDialog = defineAsyncComponent(buildLoadOptions('AccountDialog', () => import('@/domains/session/accountDialog/AccountDialog.vue')));
const AuthDialog = defineAsyncComponent(buildLoadOptions('AuthDialog', () => import('@/domains/session/authDialog/AuthDialog.vue'), 0));
const ConnectionDialog = defineAsyncComponent(buildLoadOptions('ConnectionDialog', () => import('@/domains/config/connectionDialog/ConnectionDialog.vue')));
const KnowledgeLayout = defineAsyncComponent(buildLoadOptions('KnowledgeLayout', () => import('@/domains/knowledge/KnowledgeLayout.vue')));
const PaneSplitter = defineAsyncComponent(buildLoadOptions('PaneSplitter', () => import('@/components/ui/PaneSplitter.vue')));
const WorkbenchOptionBar = defineAsyncComponent(buildLoadOptions('WorkbenchOptionBar', () => import('@/domains/workbench/WorkbenchOptionBar.vue')));

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const PANE_SPLITTER_DEFAULT_PERCENT = 50;
const PANE_SPLITTER_PERCENT_KEY = 'dpuse-paneSplitterPercent';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeAppPaneId = ref<'workbench' | 'knowledge' | undefined>();

const knowledgeOptionBarIsVisible = ref(false);
const knowledgePaneActivated = ref(false); // Keeps the component alive so it doesn't lose its internal state when hidden.
const knowledgePaneIsActive = ref(false); // On narrow displays a pane can be active but not visible.

const paneSplitterPercent = ref(establishPaneSplitterPercent());

const route = useRoute();
const router = useRouter();

const workbenchOptionBarIsVisible = ref(false);
const workbenchPaneActivated = ref(false); // Keeps the component alive so it doesn't lose its internal state when hidden.
const workbenchPaneIsActive = ref(false); // On narrow displays a pane can be active but not visible.

// Derived State - Dialogs ─────────────────────────────────────────────────────────────────────────────────────────────

const accountDialogIsVisible = computed(() => route.query.dlg === 'account');
const authDialogIsVisible = computed(() => route.query.dlg === 'auth');
const connectionDialogIsVisible = computed(() => route.query.dlg === 'connection');

// Derived State - Panes ───────────────────────────────────────────────────────────────────────────────────────────────

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

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

router
    .isReady()
    .then(() => {
        // The initial navigation has fully completed. This block intentionally runs once to bootstrap pane state from the initial URL.
        workbenchPaneActivated.value = workbenchPaneIsActive.value = route.path !== '/';
        knowledgePaneActivated.value = knowledgePaneIsActive.value = route.query.kState === '1' && 'kView' in route.query;
        activeAppPaneId.value = workbenchPaneActivated.value ? 'workbench' : 'knowledge';
        establishActivePaneId(viewportIsWide.value);
    })
    .catch(() => {
        // Router failed to initialise — fall back to showing the workbench pane.
        workbenchPaneActivated.value = workbenchPaneIsActive.value = workbenchPaneIsVisible.value = true;
        knowledgePaneActivated.value = knowledgePaneIsActive.value = knowledgePaneIsVisible.value = false;
        activeAppPaneId.value = 'workbench';
    });

onMounted(() => initialiseServices());

watch(viewportIsWide, (newViewportIsWide) => {
    if (activeAppPaneId.value != null) establishActivePaneId(newViewportIsWide);
});

watch(paneSplitterPercent, (newPaneSplitterPercent) => localStorage.setItem(PANE_SPLITTER_PERCENT_KEY, String(newPaneSplitterPercent)));

// Handlers - Knowledge Pane/Panels ────────────────────────────────────────────────────────────────────────────────────

function handleSelectKnowledgePanel(knowledgeViewId: KnowledgeViewId): void {
    activeAppPaneId.value = 'knowledge';
    knowledgePaneIsActive.value = knowledgePaneIsVisible.value = route.query.kView !== knowledgeViewId || knowledgePaneIsVisible.value !== true;
    if (knowledgePaneIsActive.value) knowledgePaneActivated.value = true;
    router.replace({ query: { ...route.query, kState: knowledgePaneIsVisible.value ? 1 : undefined, kView: knowledgeViewId } });
    knowledgeOptionBarIsVisible.value = false;
}

function handleToggleKnowledgePane(): void {
    if (viewportIsWide.value) {
        if (knowledgePaneIsVisible.value && !workbenchPaneIsVisible.value) return; // Don't close the knowledge pane if it's the only one visible.
        toggleKnowledgePane();
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
    toggleKnowledgePane();
}

function toggleKnowledgePane(): void {
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

// Handlers - Workbench Option Bar ─────────────────────────────────────────────────────────────────────────────────────

function handleWorkbenchOptionBarHide(): void {
    if (viewportIsWide.value) return;
    knowledgeOptionBarIsVisible.value = false;
    workbenchOptionBarIsVisible.value = false;
}

// Handlers - Workbench Pane ───────────────────────────────────────────────────────────────────────────────────────────

function handleToggleWorkbenchPane(): void {
    if (viewportIsWide.value) {
        if (workbenchPaneIsVisible.value && !knowledgePaneIsVisible.value) return; // Don't close the workbench pane if it's the only one visible.
        toggleWorkbenchPane();
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
    toggleWorkbenchPane();
}

function toggleWorkbenchPane(): void {
    if (route.path === '/') {
        // Then - workbench pane has never been activated, active and navigate to last known route.
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

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function establishActivePaneId(viewportIsWide: boolean): void {
    if (viewportIsWide) {
        workbenchPaneIsVisible.value = workbenchPaneIsActive.value;
        knowledgePaneIsVisible.value = knowledgePaneIsActive.value;
    } else {
        workbenchPaneIsVisible.value = workbenchPaneIsActive.value && activeAppPaneId.value === 'workbench';
        knowledgePaneIsVisible.value = knowledgePaneIsActive.value && activeAppPaneId.value === 'knowledge';
    }
}

function establishPaneSplitterPercent(): number {
    try {
        return Number(localStorage.getItem(PANE_SPLITTER_PERCENT_KEY)) || PANE_SPLITTER_DEFAULT_PERCENT;
    } catch {
        return PANE_SPLITTER_DEFAULT_PERCENT;
    }
}
</script>

<template>
    <div class="fixed inset-0 flex bg-surface pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-content" data-region="App">
        <!--
          z-10: Content: WorkbenchPane (includes fixed WorkbenchOptionBar), PaneSplitter & KnowledgePane
          z-20: topFadeOut, knowledgeActionBar
          z-30: WorkbenchOptionBar (floating)
          z-40: workbenchPaneToggle
          z-50: LoadingMask (busy — dialogs and async components)
          z-55: LoadingMask (navigation)
          z-60: DialogLayout/AuthDialog, DialogLayout/AccountDialog & DialogLayout/ConnectionDialogDialog
          z-70: ProgressBar
          -->

        <!-- Mask - Semi-transparent mask over the top safe area, so scrolling content fades out beneath it. -->
        <div class="fixed inset-x-0 top-0 z-20 h-[env(safe-area-inset-top)] bg-linear-to-t from-transparent via-surface/80 via-25% to-surface/95" data-region="topFadeOut" />

        <!-- Navigation progress bar. Always visible. -->
        <ProgressBar class="fixed inset-x-0 top-[env(safe-area-inset-top)] z-70" />

        <!-- Busy loading mask - shown during dialog and async component loading. -->
        <LoadingMask :state="busyLoadingState" class="z-50" />

        <!-- Nav loading mask - transparent blocker on route change, fades to visible overlay while component downloads. -->
        <LoadingMask :state="navLoadingState" class="z-55" />

        <!-- Workbench toggle fixed in top left corner. Always visible. -->
        <Button
            :aria-label="t(T, 'wb.toggle.label.aria')"
            class="fixed top-(--safe-top-offset) left-(--safe-left-offset) z-40 rounded-full!"
            :class="{ 'shadow-md': !viewportIsWide && contentScrollPosition > 0 }"
            data-region="workbenchPaneToggle"
            shape="icon"
            @click="handleToggleWorkbenchPane"
        >
            <DPUseLogo />
        </Button>

        <!-- Knowledge toggle fixed in top right corner. Always visible. -->
        <div class="fixed top-(--safe-top-offset) right-(--safe-right-offset) z-20 flex" data-region="knowledgeActionBar">
            <nav v-if="viewportIsWide || knowledgeOptionBarIsVisible" aria-label="Knowledge options" data-region="knowledgeOptionBar">
                <Button :aria-label="t(T, 'k.select.about.aria')" shape="icon" @click="handleSelectKnowledgePanel('about')">
                    <InfoIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>

                <Button :aria-label="t(T, 'k.select.library.aria')" shape="icon" @click="handleSelectKnowledgePanel('library')">
                    <LibraryBigIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>

                <Button :aria-label="t(T, 'k.select.chat.aria')" shape="icon" @click="handleSelectKnowledgePanel('chat')">
                    <MessageCircleMoreIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>
            </nav>

            <Button
                :aria-label="t(T, 'k.toggle.label.aria')"
                class="rounded-full! bg-surface"
                :class="{ 'shadow-md': !viewportIsWide && contentScrollPosition > 0 }"
                data-region="knowledgePaneToggle"
                shape="icon"
                @click="handleToggleKnowledgePane"
            >
                <KnowledgeLogo />
            </Button>
        </div>

        <!-- Session Button - Always visible. -->
        <SessionButton class="fixed bottom-(--safe-bottom-offset) left-(--safe-left-offset) z-60" :workbench-option-bar-is-visible="workbenchOptionBarIsVisible" />

        <!-- Authentication Dialog - Activated using URL parameter 'dlg=auth'. -->
        <Transition name="dialog-fade">
            <DialogLayout v-if="authDialogIsVisible" v-slot="{ close }" class="z-60">
                <AuthDialog :close="close" />
            </DialogLayout>
        </Transition>

        <!-- Account Dialog - Activated using URL parameter 'dlg=account'. -->
        <Transition name="dialog-fade">
            <DialogLayout v-if="accountDialogIsVisible" v-slot="{ close }" class="z-60">
                <AccountDialog :close="close" />
            </DialogLayout>
        </Transition>

        <!-- Connection Dialog - Activated using URL parameter 'dlg=connection'. -->
        <Transition name="dialog-fade">
            <DialogLayout v-if="connectionDialogIsVisible" v-slot="{ close }" class="z-60">
                <ConnectionDialog :close="close" />
            </DialogLayout>
        </Transition>

        <!-- Workbench Option Bar - Only rendered when viewport is narrow. -->
        <WorkbenchOptionBar v-if="!viewportIsWide" class="z-30" :is-visible="workbenchOptionBarIsVisible" @continue="handleWorkbenchOptionBarHide" />

        <!-- Workbench Pane - Contains workbench layout (via RouterView). Rendered once workbench pane is activated and visible. -->
        <div
            v-if="workbenchPaneActivated"
            v-show="workbenchPaneIsVisible"
            class="grid h-full"
            :class="viewportIsWide ? 'grid-cols-[65px_1fr]' : 'grid-cols-1'"
            data-region="workbenchPane"
            :style="[workbenchPaneStyle, { 'container-type': 'inline-size' }]"
            @pointerdown="activeAppPaneId = 'workbench'"
            @scroll.capture="activeAppPaneId = 'workbench'"
        >
            <!-- Workbench Option Bar - Only rendered when viewport is wide. -->
            <WorkbenchOptionBar v-if="viewportIsWide" class="overflow-y-hidden" @continue="handleWorkbenchOptionBarHide" />

            <!-- 'col-start-2' required to ensure content is place in 2nd grid column when async sidebar unresolved. Minimises CLS WebVital metric. -->
            <div class="min-h-0" :class="{ 'col-start-2': viewportIsWide }" data-region="workbench-content">
                <RouterView v-slot="{ Component }">
                    <Transition name="route-fade" mode="out-in">
                        <component :is="Component" :key="$route.matched.find((r) => r.components?.default)?.path" />
                    </Transition>
                </RouterView>
            </div>
        </div>

        <!-- Pane (Vertical) Splitter - Rendered if viewport is wide and both panes are shown. -->
        <PaneSplitter v-if="paneSplitterIsVisible" v-model="paneSplitterPercent" />

        <!-- Knowledge Pane - Contains knowledge layout. Rendered once knowledge pane is activated and visible. -->
        <div
            v-if="knowledgePaneActivated"
            v-show="knowledgePaneIsVisible"
            class="flex h-full"
            data-region="knowledgePane"
            :style="knowledgePaneStyle"
            @pointerdown="activeAppPaneId = 'knowledge'"
            @scroll.capture="activeAppPaneId = 'knowledge'"
        >
            <KnowledgeLayout class="flex-1" :workbench-pane-is-hidden="!workbenchPaneIsVisible" />
        </div>
    </div>
</template>

<style scoped>
/* Dialog Fade Transition (Vue) */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
    transition: opacity 0.15s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
    opacity: 0;
}

/* VueRoute Fade Transition (Vue) */
.route-fade-enter-active,
.route-fade-leave-active {
    transition: opacity 0.15s ease;
}
.route-fade-enter-from,
.route-fade-leave-to {
    opacity: 0;
}

/* Disable Dialog and Route fade transitions when reduced monition is preferred. */
@media (prefers-reduced-motion: reduce) {
    .dialog-fade-enter-active,
    .dialog-fade-leave-active,
    .route-fade-enter-active,
    .route-fade-leave-active {
        transition: none;
    }
}
</style>
