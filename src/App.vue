<script setup lang="ts">
// External Dependencies
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { InfoIcon, LibraryBigIcon, MessageCircleMoreIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// App Core
import { useDisplayBreakpoint } from '@/composables/useDisplayBreakpoint';
import { useSessionStore } from '@/stores/sessionStore';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue'; // Required for workbench and knowledge toggle buttons which are always visible.
import ChunkLoadError from '@/components/chunkLoadError/ChunkLoadError.vue';
import DialogWrapper from '@/components/dialog/DialogWrapper.vue';
import DPUseLogoIcon from '@/components/icon/logos/DPUseLogoIcon.vue'; // Always visible.
import KnowledgeIcon from '@/components/icon/KnowledgeIcon.vue'; // Always visible.
import type { KnowledgeViewId } from '@/views/knowledge/Knowledge.vue';
import NavProgressBar from '@/components/navProgressBar/NavProgressBar.vue'; // Required when lazy loading is delayed.
import SessionButton from '@/components/session/SessionButton.vue'; // Always visible.

// App Components & Views - Lazy loaded as required.
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
const Knowledge = defineAsyncComponent({ loader: () => import('@/views/knowledge/Knowledge.vue'), errorComponent: ChunkLoadError });
const PaneSplitter = defineAsyncComponent({ loader: () => import('@/components/paneSplitter/PaneSplitter.vue'), errorComponent: ChunkLoadError });
const WorkbenchOptionBar = defineAsyncComponent({ loader: () => import('@/components/workbenchOptionBar/WorkbenchOptionBar.vue'), errorComponent: ChunkLoadError });

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { displayIsWide } = useDisplayBreakpoint();
const route = useRoute();
const router = useRouter();

// Reactive State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type AppPaneId = 'workbench' | 'knowledge';
const activeAppPaneId = ref<AppPaneId | undefined>(undefined); // TODO: Consider a param to remember.

const knowledgeOptionBarIsVisible = ref(false);
const knowledgePaneActivated = ref(false);
const knowledgePaneIsActive = ref(false);
const knowledgePaneIsVisible = ref(false);

const paneSplitterPercent = ref(50);

const workbenchOptionBarIsVisible = ref(false);
const workbenchPaneActivated = ref(false);
const workbenchPaneIsActive = ref(false);
const workbenchPaneIsVisible = ref(false);

/////////

const activeWorkbenchViewId = ref<string | undefined>();
const activeKnowledgeViewId = ref<KnowledgeViewId>((route.query.kView as KnowledgeViewId) ?? 'about');

// Derived State - Dialogs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const acctMgmtDialogIsVisible = computed(() => route.query.dlg === 'acctMgmt');
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

router.isReady().then(() => {
    workbenchPaneActivated.value = workbenchPaneIsActive.value = route.path !== '/';
    knowledgePaneActivated.value = knowledgePaneIsActive.value = route.query.kState === '1' && 'kView' in route.query;
    activeAppPaneId.value = workbenchPaneActivated.value ? 'workbench' : 'knowledge';
    establishActiveAppPanelId(displayIsWide.value);
});

onMounted(() => useSessionStore().initialiseServices());

watch(displayIsWide, (newDisplayIsWide) => establishActiveAppPanelId(newDisplayIsWide));

// UI Helpers - Options ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function completeOptionInvocation(paneId: AppPaneId): void {
    if (!displayIsWide.value) activeAppPaneId.value = paneId;
}

// UI Helpers - Panes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleOptionClick(knowledgeViewId: KnowledgeViewId): void {
    knowledgePaneIsActive.value = knowledgePaneIsVisible.value = route.query.kView !== knowledgeViewId || knowledgePaneIsVisible.value !== true;
    activeKnowledgeViewId.value = knowledgeViewId;
    router.replace({ query: { ...route.query, kState: knowledgePaneIsVisible.value ? 1 : undefined, kView: knowledgeViewId } });
    knowledgeOptionBarIsVisible.value = false;
}

function toggleAppPane(appPaneId: AppPaneId): void {
    if (displayIsWide.value) {
        if (appPaneId === 'workbench') {
            toggleWorkbenchAppPane();
        } else {
            toggleKnowledgeAppPane();
        }
        if (workbenchPaneIsVisible.value && appPaneId === 'workbench') {
            activeAppPaneId.value = 'workbench';
        } else if (knowledgePaneIsVisible.value && appPaneId === 'knowledge') {
            activeAppPaneId.value = 'knowledge';
        }
    } else {
        if (workbenchPaneIsVisible.value && appPaneId === 'workbench') {
            workbenchOptionBarIsVisible.value = !workbenchOptionBarIsVisible.value;
        } else if (knowledgePaneIsVisible.value && appPaneId === 'knowledge') {
            knowledgeOptionBarIsVisible.value = !knowledgeOptionBarIsVisible.value;
        } else {
            if (appPaneId === 'workbench') {
                if (knowledgeOptionBarIsVisible.value) {
                    knowledgeOptionBarIsVisible.value = false;
                } else {
                    knowledgePaneIsVisible.value = false;
                    toggleWorkbenchAppPane();
                }
            } else {
                if (workbenchOptionBarIsVisible.value) {
                    workbenchOptionBarIsVisible.value = false;
                } else {
                    workbenchPaneIsVisible.value = false;
                    toggleKnowledgeAppPane();
                }
            }
            activeAppPaneId.value = appPaneId;
        }
    }
}

function toggleWorkbenchAppPane(): void {
    if (route.path === '/') {
        workbenchPaneActivated.value = workbenchPaneIsActive.value = workbenchPaneIsVisible.value = true;
        router.replace({
            name: (route.query.wbView as string) ?? 'workflow',
            query: { ...route.query, wbState: workbenchPaneIsVisible.value ? 1 : undefined, kState: knowledgePaneIsVisible.value ? 1 : undefined }
        });
    } else {
        workbenchPaneIsVisible.value = !workbenchPaneIsVisible.value;
        router.replace({ query: { ...route.query, wbState: workbenchPaneIsVisible.value ? 1 : undefined, kState: knowledgePaneIsVisible.value ? 1 : undefined } });
    }
}

function toggleKnowledgeAppPane(): void {
    if ('kView' in route.query) {
        knowledgePaneIsVisible.value = !knowledgePaneIsVisible.value;
        router.replace({ query: { ...route.query, wbState: workbenchPaneIsVisible.value ? 1 : undefined, kState: knowledgePaneIsVisible.value ? 1 : undefined } });
    } else {
        knowledgePaneActivated.value = knowledgePaneIsActive.value = knowledgePaneIsVisible.value = true;
        router.replace({ query: { ...route.query, kView: 'about', wbState: workbenchPaneIsVisible.value ? 1 : undefined, kState: knowledgePaneIsVisible.value ? 1 : undefined } });
    }
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function establishActiveAppPanelId(displayIsWide: boolean): void {
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
    <!-- <div class="bg-surface text-content fixed inset-0 flex pt-[env(safe-area-inset-top)]"> -->
    <div class="bg-surface text-content fixed inset-0 flex">
        <div class="bg-surface/50 fixed inset-x-0 top-0 h-[env(safe-area-inset-top)] backdrop-blur-xs" />

        <!-- Navigation progress bar. Always visible. -->
        <NavProgressBar />

        <!-- Workbench toggle fixed in top left corner. Always visible. -->
        <Button class="fixed top-[calc(env(safe-area-inset-top)+7px)] left-3 z-40" variant="iconLarge" @click="toggleAppPane('workbench')">
            <DPUseLogoIcon />
        </Button>

        <!-- Knowledge toggle fixed in top right corner. Always visible. -->
        <div class="fixed top-[calc(env(safe-area-inset-top)+7px)] right-3 z-40 flex">
            <div v-if="displayIsWide || knowledgeOptionBarIsVisible">
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

            <!-- <Button :disabled="!workbenchPaneIsVisible" variant="iconLarge" @click="toggleAppPane('knowledge')"> -->
            <Button variant="iconLarge" @click="toggleAppPane('knowledge')">
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

        <!-- Account Management dialog activated using url parameter 'dlg=acctMgmt'. -->
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
            <Knowledge class="flex-1" :workbench-pane-is-hidden="!workbenchPaneIsVisible" />
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
