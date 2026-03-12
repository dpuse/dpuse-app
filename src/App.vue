<script setup lang="ts">
// External Dependencies
import { useRoute, useRouter } from 'vue-router';
import { computed, defineAsyncComponent, onUnmounted, ref, watch } from 'vue';

// App Core
import type { BenchtopOptionLocalisedConfig } from './types/workbench';

// App Components
import Button from '@/components/button/Button.vue'; // Required workbench and knowledge toggle buttons which are always visible.
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

// States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();
const router = useRouter();
const isHomePage = computed(() => route.path === '/' && route.query.knowledge === undefined);

// Local States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeBenchtopOptionConfig = ref<BenchtopOptionLocalisedConfig>({ id: 'home', label: '', color: '', description: '', icon: '', step: 0, tasks: [] });
const activeOptionBarId = ref<'none' | 'workbench' | 'knowledge'>('none');
const activePaneId = ref<'workbench' | 'knowledge'>('workbench');

// Local State - Display ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const displayMediaQuery = globalThis.matchMedia('(min-width: 768px)');
const displayIsWide = ref(displayMediaQuery.matches);
const handleDisplayMediaQueryChange = (event: MediaQueryListEvent): void => void (displayIsWide.value = event.matches);
displayMediaQuery.addEventListener('change', handleDisplayMediaQueryChange);
watch(displayIsWide, () => (activeOptionBarId.value = 'none'));

// Local State - Dialogs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const acctMgmtDialogIsVisible = computed(() => route.query.dialog === 'acctMgmt');
const authDialogIsVisible = computed(() => route.query.dialog === 'auth');

// Local State - Workbench Pane ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const workbenchPaneIsHidden = ref(false);

const knowledgePaneIsHidden = ref(true);

watch(
    () => [route.path, route.query.knowledge] as const,
    ([path, knowledge]) => {
        if (path === '/') {
            const knowledgeOnly = knowledge !== undefined;
            workbenchPaneIsHidden.value = knowledgeOnly;
            knowledgePaneIsHidden.value = !knowledgeOnly;
        } else {
            workbenchPaneIsHidden.value = false;
        }
    },
    { immediate: true }
);

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

onUnmounted(() => displayMediaQuery.removeEventListener('change', handleDisplayMediaQueryChange));

// UI Helpers - Workbench Pane ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleWorkbenchOptionComplete(config?: BenchtopOptionLocalisedConfig): void {
    if (config) activeBenchtopOptionConfig.value = config; // TODO: This will be set to undefined when mask is clicked. Ok, if dashboard options is selected, but maybe need null return for not action click.
    activeOptionBarId.value = 'none';
    activePaneId.value = 'workbench';
}

function handleWorkbenchToggle(): void {
    if (isHomePage.value || (route.path === '/' && route.query.knowledge !== undefined)) {
        router.push('/workflow');
        return;
    }
    if (displayIsWide.value) {
        if (!workbenchPaneIsHidden.value && knowledgePaneIsHidden.value) {
            router.push('/');
            return;
        }
        workbenchPaneIsHidden.value = !workbenchPaneIsHidden.value;
        activePaneId.value = workbenchPaneIsHidden.value ? 'knowledge' : 'workbench'; // Pre-set narrow mode active pane for when display switches back.
    } else {
        activeOptionBarId.value = activeOptionBarId.value === 'workbench' ? 'none' : 'workbench';
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

// UI Helpers - Knowledge Pane ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleKnowledgeToggle(): void {
    if (isHomePage.value) {
        router.push('/?knowledge=home');
        return;
    }
    if (displayIsWide.value) {
        if (!knowledgePaneIsHidden.value && workbenchPaneIsHidden.value) {
            router.push('/');
            return;
        }
        knowledgePaneIsHidden.value = !knowledgePaneIsHidden.value;
        activePaneId.value = knowledgePaneIsHidden.value ? 'workbench' : 'knowledge'; // Pre-set narrow mode active pane for when display switches back.
    } else {
        activeOptionBarId.value = activeOptionBarId.value === 'knowledge' ? 'none' : 'knowledge';
    }
}

function handleKnowledgeOptionComplete(): void {
    activeOptionBarId.value = 'none';
    activePaneId.value = 'knowledge';
}
</script>

<template>
    <div class="bg-surface text-content fixed inset-0 flex" :class="{ 'select-none': paneSplitterIsDragging }">
        <!-- Workbench toggle fixed in top left corner. Always visible .-->
        <Button :aria-label="workbenchPaneToggleAriaLabel" class="fixed top-1.75 left-3 z-40" variant="iconLarge" @click="handleWorkbenchToggle">
            <DPUseLogoIcon />
        </Button>

        <!-- Knowledge toggle fixed in top right corner. Always visible -->
        <Button :aria-label="knowledgePaneToggleAriaLabel" class="fixed top-1.75 right-3 z-40" variant="iconLarge" @click="handleKnowledgeToggle">
            <KnowledgeIcon />
        </Button>

        <!-- Session action -->
        <Transition appear name="horizontal-slide-ltr">
            <div v-if="!isHomePage && (displayIsWide || activeOptionBarId === 'workbench')" class="fixed bottom-7 left-3 z-40">
                <SessionButton class="dpuse-horizontal-slide-ltr-element" :display-is-wide="displayIsWide" @complete="handleWorkbenchOptionComplete" />
            </div>
        </Transition>

        <!-- Authentication dialog activated using url parameter 'dialog=auth'. -->
        <DialogWrapper v-if="authDialogIsVisible">
            <AuthDialog />
        </DialogWrapper>

        <!-- Account Management dialog activated using url parameter 'dialog=acctMgmt'. -->
        <DialogWrapper v-if="acctMgmtDialogIsVisible">
            <AcctMgmtDialog :display-is-wide="displayIsWide" />
        </DialogWrapper>

        <!-- Left pane: Workbench (option bar + workbench body). -->
        <div :class="workbenchPaneClasses" :style="workbenchPaneStyle">
            <WorkbenchOptionBar
                v-if="!isHomePage"
                class="flex-none"
                :is-open-in-narrow-display="activeOptionBarId === 'workbench'"
                :display-is-wide="displayIsWide"
                @complete="handleWorkbenchOptionComplete"
            />
            <div class="flex-1 overflow-y-hidden">
                <RouterView v-slot="{ Component }">
                    <Transition name="fade" mode="out-in">
                        <component :is="Component" :key="$route.path" :benchtop-option-config="activeBenchtopOptionConfig" :display-is-wide="displayIsWide" />
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
            <KnowledgePanel class="flex-1" :display-is-wide="displayIsWide" :workbench-pane-is-hidden="workbenchPaneIsHidden" />
            <KnowledgeOptionBar
                class="flex-none"
                :is-open-in-narrow-display="activeOptionBarId === 'knowledge'"
                :display-is-wide="displayIsWide"
                @complete="handleKnowledgeOptionComplete"
            />
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
