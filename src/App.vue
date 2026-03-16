<script setup lang="ts">
// External Dependencies
import { useRouter } from 'vue-router';
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';

// App Core
import T from '@/locales/App.json';
import { t } from '@/locales';
import { useDisplayBreakpoint } from '@/composables/useDisplayBreakpoint';
import { useSessionStore } from '@/stores/sessionStore';

// App Components - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue'; // Required for workbench and knowledge toggle buttons which are always visible.
import ChunkLoadError from '@/components/chunkLoadError/ChunkLoadError.vue';
import DialogWrapper from '@/components/dialog/DialogWrapper.vue';
import DPUseLogoIcon from '@/components/icon/logos/DPUseLogoIcon.vue'; // Always visible.
import KnowledgeIcon from '@/components/icon/KnowledgeIcon.vue'; // Always visible.
import NavProgressBar from '@/components/navProgressBar/NavProgressBar.vue'; // Required when lazy loading is delayed.
import SessionButton from '@/components/session/SessionButton.vue'; // Always visible.

// App Components - Lazy loaded as required.
const AcctMgmtDialog = defineAsyncComponent({
    loader: () => new Promise((r) => setTimeout(r, 0)).then(() => import('@/components/account/AcctMgmtDialog.vue')),
    errorComponent: ChunkLoadError
});
const AuthDialog = defineAsyncComponent({
    loader: () => new Promise((r) => setTimeout(r, 0)).then(() => import('@/components/session/AuthDialog.vue')),
    errorComponent: ChunkLoadError
});
// const DialogWrapper = defineAsyncComponent({ loader: () => import('@/components/dialog/DialogWrapper.vue'), errorComponent: ChunkLoadError });
const KnowledgeOptionBar = defineAsyncComponent({ loader: () => import('@/components/knowledgeOptionBar/KnowledgeOptionBar.vue'), errorComponent: ChunkLoadError });
const KnowledgePanel = defineAsyncComponent({ loader: () => import('@/components/knowledgePanel/KnowledgePanel.vue'), errorComponent: ChunkLoadError });
const PaneSplitter = defineAsyncComponent({ loader: () => import('@/components/paneSplitter/PaneSplitter.vue'), errorComponent: ChunkLoadError });
const WorkbenchOptionBar = defineAsyncComponent({ loader: () => import('@/components/workbenchOptionBar/WorkbenchOptionBar.vue'), errorComponent: ChunkLoadError });

// External State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { displayIsWide } = useDisplayBreakpoint();
const router = useRouter();

// Reactive State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeOptionBarId = ref<'workbench' | 'knowledge' | undefined>(undefined);
const activePaneId = ref<'workbench' | 'knowledge'>(router.currentRoute.value.path === '/' ? 'knowledge' : 'workbench');
const paneSplitterPercent = ref(50);
const workbenchOptionBarInitialised = ref(displayIsWide.value);
const knowledgeOptionBarInitialised = ref(displayIsWide.value);

// Derived State - Dialogs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const acctMgmtDialogIsVisible = computed(() => router.currentRoute.value.query.dialog === 'acctMgmt');
const authDialogIsVisible = computed(() => router.currentRoute.value.query.dialog === 'auth');

// Derived State - Panes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(() => useSessionStore().initialiseServices());

watch(displayIsWide, (isWide) => {
    activeOptionBarId.value = undefined;
    if (isWide) {
        workbenchOptionBarInitialised.value = true;
        knowledgeOptionBarInitialised.value = true;
    } else {
        activePaneId.value = router.currentRoute.value.path === '/' ? 'knowledge' : 'workbench';
    }
});

watch(activeOptionBarId, (id) => {
    if (id === 'workbench') workbenchOptionBarInitialised.value = true;
    if (id === 'knowledge') knowledgeOptionBarInitialised.value = true;
});

watch(
    () => router.currentRoute.value.path,
    (path) => {
        if (!displayIsWide.value) activePaneId.value = path === '/' ? 'knowledge' : 'workbench';
    }
);

// UI Helpers - Options ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function completeOptionInvocation(paneId: 'workbench' | 'knowledge'): void {
    activeOptionBarId.value = undefined;
    if (!displayIsWide.value) activePaneId.value = paneId;
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
        // On narrow display, always just toggle the option bar; navigation happens via option bar links.
        activeOptionBarId.value = activeOptionBarId.value === pane ? undefined : pane;
    }
}
</script>

<template>
    <div class="bg-surface text-content fixed inset-0 flex pt-[env(safe-area-inset-top)]">
        <!-- Navigation progress bar. Always visible. -->
        <NavProgressBar />

        <!-- Workbench toggle fixed in top left corner. Always visible .-->
        <Button
            :aria-label="constructPaneToggleAriaLabel('workbench')"
            class="fixed top-[calc(env(safe-area-inset-top)+7px)] left-3 z-40"
            variant="iconLarge"
            @click="togglePane('workbench')"
        >
            <DPUseLogoIcon />
        </Button>

        <!-- Knowledge toggle fixed in top right corner. Always visible -->
        <Button
            :aria-label="constructPaneToggleAriaLabel('knowledge')"
            class="fixed top-[calc(env(safe-area-inset-top)+7px)] right-3 z-40"
            variant="iconLarge"
            @click="togglePane('knowledge')"
        >
            <KnowledgeIcon />
        </Button>

        <!-- Session button - always visible, independent of pane state -->
        <div class="fixed bottom-4 left-3 z-40">
            <SessionButton :workbench-option-bar-is-visible="activeOptionBarId === 'workbench'" />
        </div>

        <!-- Authentication dialog activated using url parameter 'dialog=auth'. -->
        <Transition name="dialog">
            <DialogWrapper v-if="authDialogIsVisible">
                <AuthDialog />
            </DialogWrapper>
        </Transition>

        <!-- Account Management dialog activated using url parameter 'dialog=acctMgmt'. -->
        <Transition name="dialog">
            <DialogWrapper v-if="acctMgmtDialogIsVisible">
                <AcctMgmtDialog />
            </DialogWrapper>
        </Transition>

        <!-- Workbench option bar - narrow display overlay, rendered at top level so it's accessible regardless of whether the workbench pane is active. -->
        <WorkbenchOptionBar
            v-if="!displayIsWide && workbenchOptionBarInitialised"
            :is-open-in-narrow-display="activeOptionBarId === 'workbench'"
            @continue="completeOptionInvocation('workbench')"
        />

        <!-- Left Pane - Workbench option bar (wide only) and panel. -->
        <div v-if="showWorkbench" :class="workbenchPaneClasses" :style="workbenchPaneStyle">
            <WorkbenchOptionBar v-if="displayIsWide" class="flex-none" :is-open-in-narrow-display="false" @continue="completeOptionInvocation('workbench')" />
            <div class="flex-1 overflow-y-hidden">
                <RouterView v-slot="{ Component }">
                    <Transition name="fade" mode="out-in">
                        <component :is="Component" :key="$route.path" />
                    </Transition>
                </RouterView>
            </div>
        </div>

        <!-- Vertical Splitter - Only visible if display is wide and both panes are visible. -->
        <PaneSplitter v-if="paneSplitterIsVisible" v-model="paneSplitterPercent" />

        <!-- Right Pane - Knowledge panel and option bar (wide only). -->
        <div v-if="showKnowledge" :class="knowledgePaneClasses">
            <KnowledgePanel class="flex-1" :workbench-pane-is-hidden="!showWorkbench" />
            <KnowledgeOptionBar v-if="displayIsWide" class="flex-none" :is-open-in-narrow-display="false" @continue="completeOptionInvocation('knowledge')" />
        </div>

        <!-- Knowledge option bar - narrow display overlay, rendered at top level so it's accessible regardless of whether the knowledge pane is active. -->
        <KnowledgeOptionBar
            v-if="!displayIsWide && knowledgeOptionBarInitialised"
            :is-open-in-narrow-display="activeOptionBarId === 'knowledge'"
            @continue="completeOptionInvocation('knowledge')"
        />
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
