<script setup lang="ts">
// External Dependencies
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { InfoIcon, LibraryBigIcon, MessageCircleMoreIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// Local (App) Framework
import { initialiseServices } from '@/state/session';
import { isBusy } from '@/state/appProgress';
import { load } from '@/utils/component';
import T from './App.json';
import { t } from '@/state/locale';
import { contentScrollPosition, knowledgePaneIsVisible, viewportIsWide, workbenchPaneIsVisible } from '@/state/appLayout';

// Local Components - Static
import BusyMask from '@/components/ui/BusyMask.vue'; // Shown during non-dialog async component loading to prevent duplicate actions.
import Button from '@/components/ui/button/Button.vue'; // Required for workbench and knowledge toggle buttons which are always visible.
import ChunkLoadError from '@/components/ui/ChunkLoadError.vue';
import DialogShell from '@/components/ui/dialog/DialogShell.vue'; // Static so dialog mask appears immediately on open.
import DPUseLogo from '@/components/branding/DPUseLogo.vue'; // Always visible.
import KnowledgeLogo from '@/components/branding/KnowledgeLogo.vue'; // Always visible.
import type { KnowledgeViewId } from '@/domains/knowledge/KnowledgeLayout.vue';
import ProgressBar from '@/components/framework/ProgressBar.vue'; // Required when lazy loading is delayed.
import SessionButton from '@/domains/session/SessionButton.vue'; // Always visible.

// Local Components - Dynamic
const AccountDialog = defineAsyncComponent({ loader: load('accountDialog', () => import('@/domains/session/accountDialog/AccountDialog.vue'), 0), errorComponent: ChunkLoadError });
const AuthDialog = defineAsyncComponent({ loader: load('authDialog', () => import('@/domains/session/authDialog/AuthDialog.vue'), 0), errorComponent: ChunkLoadError });
const ConnectionDialog = defineAsyncComponent({
    loader: load('connectionDialog', () => import('@/domains/config/connectionDialog/ConnectionDialog.vue'), 0),
    errorComponent: ChunkLoadError
});
const KnowledgeLayout = defineAsyncComponent({ loader: load('knowledgeLayout', () => import('@/domains/knowledge/KnowledgeLayout.vue'), 0), errorComponent: ChunkLoadError });
const PaneSplitter = defineAsyncComponent({
    loader: load('paneSplitter', () => import('@/components/ui/PaneSplitter.vue'), 0),
    errorComponent: ChunkLoadError
});
const WorkbenchOptionBar = defineAsyncComponent({
    loader: load('workbenchOptionBar', () => import('@/domains/workbench/WorkbenchOptionBar.vue'), 0),
    errorComponent: ChunkLoadError
});

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const PANE_SPLITTER_PERCENT_KEY = 'dpuse-paneSplitterPercent';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

type AppPaneId = 'workbench' | 'knowledge';
const activeAppPaneId = ref<AppPaneId | undefined>();

const knowledgeOptionBarIsVisible = ref(false);
const knowledgePaneActivated = ref(false); // Keeps the component alive so it doesn't lose its internal state when hidden.
const knowledgePaneIsActive = ref(false); // On narrow displays a pane can be active but not visible.

const paneSplitterPercent = ref(Number(localStorage.getItem(PANE_SPLITTER_PERCENT_KEY)) || 50);

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
        establishActiveAppPaneId(viewportIsWide.value);
    })
    .catch(() => {
        // Router failed to initialise — fall back to showing the workbench pane.
        workbenchPaneActivated.value = workbenchPaneIsActive.value = workbenchPaneIsVisible.value = true;
        knowledgePaneActivated.value = knowledgePaneIsActive.value = knowledgePaneIsVisible.value = false;
        activeAppPaneId.value = 'workbench';
    });

onMounted(() => initialiseServices());

watch(viewportIsWide, (newDisplayIsWide) => {
    if (activeAppPaneId.value != null) establishActiveAppPaneId(newDisplayIsWide);
});

watch(paneSplitterPercent, (newPaneSplitterPercent) => localStorage.setItem(PANE_SPLITTER_PERCENT_KEY, String(newPaneSplitterPercent)));

// UI Helpers - Option Bars ────────────────────────────────────────────────────────────────────────────────────────────

function closeOptionBarOnNarrowDisplay(): void {
    if (viewportIsWide.value) return;
    knowledgeOptionBarIsVisible.value = false;
    workbenchOptionBarIsVisible.value = false;
}

// UI Helpers - Panes - Knowledge  ─────────────────────────────────────────────────────────────────────────────────────

function toggleKnowledgeAppPane(): void {
    if (viewportIsWide.value) {
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

// UI Helpers - Panes - Workbench ──────────────────────────────────────────────────────────────────────────────────────

function selectKnowledgePanel(knowledgeViewId: KnowledgeViewId): void {
    activeAppPaneId.value = 'knowledge';
    knowledgePaneIsActive.value = knowledgePaneIsVisible.value = route.query.kView !== knowledgeViewId || knowledgePaneIsVisible.value !== true;
    if (knowledgePaneIsActive.value) knowledgePaneActivated.value = true;
    router.replace({ query: { ...route.query, kState: knowledgePaneIsVisible.value ? 1 : undefined, kView: knowledgeViewId } });
    knowledgeOptionBarIsVisible.value = false;
}

function toggleWorkbenchAppPane(): void {
    if (viewportIsWide.value) {
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

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function establishActiveAppPaneId(viewportIsWide: boolean): void {
    if (viewportIsWide) {
        workbenchPaneIsVisible.value = workbenchPaneIsActive.value;
        knowledgePaneIsVisible.value = knowledgePaneIsActive.value;
    } else {
        workbenchPaneIsVisible.value = workbenchPaneIsActive.value && activeAppPaneId.value === 'workbench';
        knowledgePaneIsVisible.value = knowledgePaneIsActive.value && activeAppPaneId.value === 'knowledge';
    }
}
</script>

<template>
    <div class="bg-surface text-content fixed inset-0 flex pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]" data-region="App">
        <!--
          z-10: Content: WorkbenchPane (includes fixed WorkbenchOptionBar), PaneSplitter & KnowledgePane
          z-20: TopFadeOut, KnowledgeToggle
          z-30: WorkbenchOptionBar (floating)
          z-40: WorkbenchToggle
          z-50: BusyMask
          z-60: DialogShell's
          z-70: ProgressBar
          -->
        <!-- Mask - Semi-transparent mask over the top safe area, so scrolling content fades out beneath it. -->
        <div class="via-surface/80 to-surface/95 fixed inset-x-0 top-0 z-20 h-[env(safe-area-inset-top)] bg-linear-to-t from-transparent via-25%" data-region="topFadeOut" />

        <!-- Navigation progress bar. Always visible. -->
        <ProgressBar class="fixed inset-x-0 top-[env(safe-area-inset-top)] z-70" />

        <!-- Busy mask - shown during non-dialog async component loading to prevent duplicate actions. -->
        <BusyMask v-if="isBusy" class="z-50" />

        <!-- Workbench toggle fixed in top left corner. Always visible. -->
        <Button
            :aria-label="t(T, 'wb.toggle.label.aria')"
            class="fixed top-(--safe-top-offset) left-(--safe-left-offset) z-40 rounded-full!"
            :class="{ 'shadow-md': !viewportIsWide && contentScrollPosition > 0 }"
            shape="icon"
            @click="toggleWorkbenchAppPane()"
        >
            <DPUseLogo />
        </Button>

        <!-- Knowledge toggle fixed in top right corner. Always visible. -->
        <div class="fixed top-(--safe-top-offset) right-(--safe-right-offset) z-20 flex" data-region="knowledgeBar">
            <nav v-if="viewportIsWide || knowledgeOptionBarIsVisible" data-region="knowledgeOptions">
                <Button :aria-label="t(T, 'k.select.about.aria')" shape="icon" @click="selectKnowledgePanel('about')">
                    <InfoIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>

                <Button :aria-label="t(T, 'k.select.about.aria')" shape="icon" @click="selectKnowledgePanel('library')">
                    <LibraryBigIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>

                <Button :aria-label="t(T, 'k.select.about.aria')" shape="icon" @click="selectKnowledgePanel('chat')">
                    <MessageCircleMoreIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>
            </nav>

            <!-- TODO: <Button :disabled="!workbenchPaneIsVisible" variant="iconLarge" @click="toggleKnowledgeAppPane()"> -->
            <Button
                :aria-label="t(T, 'k.toggle.label.aria')"
                class="bg-surface rounded-full!"
                :class="{ 'shadow-md': !viewportIsWide && contentScrollPosition > 0 }"
                shape="icon"
                @click="toggleKnowledgeAppPane()"
            >
                <KnowledgeLogo />
            </Button>
        </div>

        <!-- Session button - always visible. -->
        <SessionButton class="fixed bottom-(--safe-bottom-offset) left-(--safe-left-offset) z-60" :workbench-option-bar-is-visible="workbenchOptionBarIsVisible" />

        <!-- Authentication dialog activated using url parameter 'dlg=auth'. -->
        <Transition name="dialog">
            <DialogShell v-if="authDialogIsVisible" v-slot="{ close }" class="z-60">
                <AuthDialog :close="close" />
            </DialogShell>
        </Transition>

        <!-- Account dialog activated using url parameter 'dlg=account'. -->
        <Transition name="dialog">
            <DialogShell v-if="accountDialogIsVisible" v-slot="{ close }" class="z-60">
                <AccountDialog :close="close" />
            </DialogShell>
        </Transition>

        <!-- Connection dialog activated using url parameter 'dlg=connection'. -->
        <Transition name="dialog">
            <DialogShell v-if="connectionDialogIsVisible" v-slot="{ close }" class="z-60">
                <ConnectionDialog :close="close" />
            </DialogShell>
        </Transition>

        <!-- Workbench option bar - narrow display overlay, rendered at top level so it's accessible regardless of whether the workbench pane is active. -->
        <WorkbenchOptionBar v-if="!viewportIsWide" class="z-30" :is-visible="workbenchOptionBarIsVisible" @continue="closeOptionBarOnNarrowDisplay()" />

        <!-- Workbench Pane - Workbench option bar (wide only) and panel. -->
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
            <WorkbenchOptionBar v-if="viewportIsWide" class="overflow-y-hidden" @continue="closeOptionBarOnNarrowDisplay()" />

            <!-- 'col-start-2' required to ensure content is place in 2nd grid column when async sidebar unresolved. Minimises CLS WebVital metric. -->
            <div class="min-h-0" :class="{ 'col-start-2': viewportIsWide }" data-region="workbench-content">
                <RouterView v-slot="{ Component }">
                    <Transition name="route-fade" mode="out-in">
                        <component :is="Component" :key="$route.matched.find((r) => r.components?.default)?.path" />
                    </Transition>
                </RouterView>
            </div>
        </div>

        <!-- Vertical Splitter - Only visible if display is wide and both panes are visible. -->
        <PaneSplitter v-if="paneSplitterIsVisible" v-model="paneSplitterPercent" />

        <!-- Knowledge Pane - Knowledge panel and option bar. -->
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
