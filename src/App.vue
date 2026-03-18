<script setup lang="ts">
// External Dependencies
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { InfoIcon, LibraryBigIcon, MessageCircleMoreIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

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
import type { KnowledgePanelTypeId } from '@/components/knowledgePanel/KnowledgePanel.vue';
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
const route = useRoute();
const router = useRouter();

// Reactive State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type AppPaneId = 'workbench' | 'knowledge';
const activeAppPaneId = ref<AppPaneId>(router.currentRoute.value.path === '/' ? 'knowledge' : 'workbench'); // TODO: Consider a param to remember.
const activeKnowledgePanelId = ref<KnowledgePanelTypeId>((router.currentRoute.value.query.knowledge as KnowledgePanelTypeId) ?? 'about');

const knowledgeOptionBarIsVisible = ref(false);

const knowledgePaneActivated = ref(false);
const knowledgePaneIsActive = ref(false);
const knowledgePaneIsVisible = ref(false);

const paneSplitterPercent = ref(50);

const workbenchOptionBarIsVisible = ref(false);

const workbenchPaneActivated = ref(false);
const workbenchPaneIsActive = ref(false);
const workbenchPaneIsVisible = ref(false);

// Derived State - Dialogs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const acctMgmtDialogIsVisible = computed(() => router.currentRoute.value.query.dialog === 'acctMgmt');
const authDialogIsVisible = computed(() => router.currentRoute.value.query.dialog === 'auth');

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

/////////

const showWorkbench = computed(() => router.currentRoute.value.path !== '/');
const showKnowledge = computed(() => 'knowledge' in router.currentRoute.value.query);
const showKnowledgeOptions = ref(false);

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.isReady().then(() => {
    if (displayIsWide.value) {
        knowledgePaneActivated.value = knowledgePaneIsActive.value = knowledgePaneIsVisible.value = 'knowledge' in route.query;
        workbenchPaneActivated.value = workbenchPaneIsActive.value = workbenchPaneIsVisible.value = route.path !== '/';
    } else {
        knowledgePaneActivated.value = knowledgePaneIsActive.value = 'knowledge' in route.query;
        workbenchPaneActivated.value = workbenchPaneIsActive.value = route.path !== '/';
        knowledgePaneIsVisible.value = knowledgePaneIsActive.value && activeAppPaneId.value === 'knowledge';
        workbenchPaneIsVisible.value = workbenchPaneIsActive.value && activeAppPaneId.value === 'workbench';
    }
});

onMounted(() => useSessionStore().initialiseServices());

watch(displayIsWide, (newDisplayIsWide) => {
    if (newDisplayIsWide) {
        knowledgePaneIsVisible.value = knowledgePaneIsActive.value;
        workbenchPaneIsVisible.value = workbenchPaneIsActive.value;
    } else {
        knowledgePaneIsVisible.value = knowledgePaneIsActive.value && activeAppPaneId.value === 'knowledge';
        workbenchPaneIsVisible.value = workbenchPaneIsActive.value && activeAppPaneId.value === 'workbench';
    }
});

// UI Helpers - Options ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function completeOptionInvocation(paneId: AppPaneId): void {
    if (!displayIsWide.value) activeAppPaneId.value = paneId;
}

// UI Helpers - Panes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleOptionClick(view: KnowledgePanelTypeId): void {
    activeKnowledgePanelId.value = view;
    router.push({ path: '/', query: { ...router.currentRoute.value.query, knowledge: view } });
}

function toggleAppPane(id: AppPaneId): void {
    if (displayIsWide.value) {
        if (id === 'workbench') {
            workbenchPaneIsVisible.value = !workbenchPaneIsVisible.value;
        } else {
            knowledgePaneIsVisible.value = !knowledgePaneIsVisible.value;
        }
        activeAppPaneId.value = id;
    } else {
        if (workbenchPaneIsVisible.value && id === 'workbench') {
            workbenchOptionBarIsVisible.value = !workbenchOptionBarIsVisible.value;
        } else if (knowledgePaneIsVisible.value && id === 'knowledge') {
            knowledgeOptionBarIsVisible.value = !knowledgeOptionBarIsVisible.value;
        } else {
            workbenchPaneIsVisible.value = !workbenchPaneIsVisible.value;
            knowledgePaneIsVisible.value = !knowledgePaneIsVisible.value;
            activeAppPaneId.value = id;
        }
    }
}

// async function toggleAppPane(pane: AppPaneId): Promise<void> {
//     if (displayIsWide.value) {
//         if (pane === 'workbench') {
//             if (showWorkbench.value) {
//                 if (!showKnowledge.value) return; // Can't hide the only visible pane.
//                 await router.push({ path: '/', query: { ...router.currentRoute.value.query } });
//             } else {
//                 await router.push({ path: '/workflow', query: router.currentRoute.value.query });
//             }
//         } else {
//             if (showKnowledge.value) {
//                 if (!showWorkbench.value) return; // Can't hide the only visible pane.
//                 const query = Object.fromEntries(Object.entries(router.currentRoute.value.query).filter(([k]) => k !== 'knowledge'));
//                 await router.push({ path: router.currentRoute.value.path, query });
//             } else {
//                 await router.push({ path: router.currentRoute.value.path, query: { ...router.currentRoute.value.query, knowledge: activeKnowledgePanelId.value } });
//             }
//         }
//     } else {
//         if (pane === 'workbench') {
//             // On narrow display, always just toggle the option bar; navigation happens via option bar links.
//             activeOptionBarId.value = activeOptionBarId.value === pane ? undefined : pane;
//         } else {
//             showKnowledgeOptions.value = !showKnowledgeOptions.value;
//             activeOptionBarId.value = activeOptionBarId.value === pane ? undefined : pane;
//         }
//     }
// }
</script>

<template>
    <div class="bg-surface text-content fixed inset-0 flex pt-[env(safe-area-inset-top)]">
        <!-- Navigation progress bar. Always visible. -->
        <NavProgressBar />

        <!-- Workbench toggle fixed in top left corner. Always visible. -->
        <Button class="fixed top-[calc(env(safe-area-inset-top)+7px)] left-3 z-40" variant="iconLarge" @click="toggleAppPane('workbench')">
            <DPUseLogoIcon />
        </Button>

        <!-- Knowledge toggle fixed in top right corner. Always visible. -->
        <div class="fixed top-[calc(env(safe-area-inset-top)+7px)] right-3 z-40 flex">
            <div v-if="showKnowledgeOptions">
                <Button variant="iconLarge" @click="handleOptionClick('about')">
                    <InfoIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>

                <Button variant="iconLarge" @click="handleOptionClick('library')">
                    <LibraryBigIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>

                <Button variant="iconLarge" @click="handleOptionClick('chat')">
                    <MessageCircleMoreIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>
            </div>

            <Button :disabled="!workbenchPaneIsVisible" variant="iconLarge" @click="toggleAppPane('knowledge')">
                <KnowledgeIcon />
            </Button>
        </div>

        <!-- Session button - always visible, independent of pane state -->
        <div class="fixed bottom-4 left-3 z-40">
            <SessionButton :workbench-option-bar-is-visible="workbenchOptionBarIsVisible" />
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
        <WorkbenchOptionBar v-if="!displayIsWide" :is-open-in-narrow-display="workbenchOptionBarIsVisible" @continue="completeOptionInvocation('workbench')" />

        <!-- Left Pane - Workbench option bar (wide only) and panel. -->
        <div
            v-if="workbenchPaneActivated"
            v-show="workbenchPaneIsVisible"
            class="flex h-full"
            :style="workbenchPaneStyle"
            @pointerdown="activeAppPaneId = 'workbench'"
            @scroll.capture="activeAppPaneId = 'workbench'"
        >
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
        <div
            v-if="knowledgePaneActivated"
            v-show="knowledgePaneIsVisible"
            class="flex h-full"
            :style="knowledgePaneStyle"
            @pointerdown="activeAppPaneId = 'knowledge'"
            @scroll.capture="activeAppPaneId = 'knowledge'"
        >
            <KnowledgePanel class="flex-1" :workbench-pane-is-hidden="!workbenchPaneIsVisible" />
            <!-- <KnowledgeOptionBar v-if="displayIsWide" class="flex-none" :is-open-in-narrow-display="false" @continue="completeOptionInvocation('knowledge')" /> -->
        </div>

        <!-- Knowledge option bar - narrow display overlay, rendered at top level so it's accessible regardless of whether the knowledge pane is active. -->
        <!-- <KnowledgeOptionBar
            v-if="!displayIsWide && knowledgeOptionBarInitialised"
            :is-open-in-narrow-display="knowledgeOptionBarIsVisible"
            @continue="completeOptionInvocation('knowledge')"
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
