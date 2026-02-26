<script setup lang="ts">
// External dependencies
import { useRoute } from 'vue-router';
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { useColorMode, useMediaQuery } from '@vueuse/core';

// App core
import type { BenchtopOptionLocalisedConfig } from './types/workbench';
import { useSessionStore } from '@/stores/sessionStore';

// App components
import ActionButton from '@/components/action/ActionButton.vue';
import DPULogoIcon from '@/components/icon/logos/DPULogoIcon.vue';
import KnowledgeIcon from '@/components/icon/KnowledgeIcon.vue';
import KnowledgeOptionBar from '@/components/knowledgeOptionBar/KnowledgeOptionBar.vue';
import KnowledgePanel from '@/components/knowledgePanel/KnowledgePanel.vue';
import Separator from '@/components/separator/Separator.vue';
// import SessionIcon from '@/components/icon/SessionIcon.vue';
import WorkbenchOptionBar from '@/components/workbenchOptionBar/WorkbenchOptionBar.vue';

// App components (lazy loaded)
const AuthDialog = defineAsyncComponent(() => import('@/components/account/AuthDialog.vue'));

// Global state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

useColorMode(); // CSP requires hash for useColorMode's transition-disabling style; see error message for hash
const sessionState = useSessionStore();

// Local state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeBenchtopOptionConfig = ref<BenchtopOptionLocalisedConfig | undefined>();
const activeOptionBarId = ref<'none' | 'workbench' | 'knowledge'>('none'); // TODO: Can these be combined; should we have 'both' for wide display
const activePaneId = ref<'workbench' | 'knowledge'>('workbench');
const workbenchPaneIsHidden = ref(false);
const paneSplitterIsDragging = ref(false);
const paneSplitterPercent = ref(50);
const knowledgePaneIsHidden = ref(false);

// Local display state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const displayIsWide = useMediaQuery('(min-width: 768px)');
watch(displayIsWide, () => (activeOptionBarId.value = 'none'));

// Local session panel state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sessionPanelIsVisible = ref(false);

// Local route state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();
const authDialogIsVisible = computed(() => route.query.dialog === 'auth');

// Local workbench pane state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const workbenchPaneIsVisible = computed(() => {
    if (displayIsWide.value) return !workbenchPaneIsHidden.value;
    return activePaneId.value === 'workbench';
});

const workbenchPaneClasses = computed(() => {
    if (displayIsWide.value) {
        if (workbenchPaneIsHidden.value) return 'hidden';
        return 'flex h-full min-w-0';
    }
    // Narrow mode: use w-0 overflow-hidden for inactive pane so option bar overlays remain functional
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

// Local pane splitter state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const paneSplitterIsVisible = computed(() => displayIsWide.value && workbenchPaneIsVisible.value && isKnowledgeVisible.value);

// Local knowledge pane state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const isKnowledgeVisible = computed(() => {
    if (displayIsWide.value) return !knowledgePaneIsHidden.value;
    return activePaneId.value === 'knowledge';
});

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

// Lifecycle event handlers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const avatarUrl = ref('');

async function gravatarUrl(email: string, size: number): Promise<string> {
    const normalized = email.trim().toLowerCase();

    const data = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    const hashArray = [...new Uint8Array(hashBuffer)];
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return `https://gravatar.com/avatar/${hashHex}?s=${size}&d=mp`;
}

onMounted(async () => {
    useSessionStore().initialiseServices();
    avatarUrl.value = await gravatarUrl('terrell.jm@gmail.com', 40);
});

// Workbench pane UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleWorkbenchToggle(): void {
    if (displayIsWide.value) {
        // Don't close if it's the only open panel
        if (!workbenchPaneIsHidden.value && knowledgePaneIsHidden.value) return;
        workbenchPaneIsHidden.value = !workbenchPaneIsHidden.value;
        activePaneId.value = workbenchPaneIsHidden.value ? 'knowledge' : 'workbench';
    } else {
        activeOptionBarId.value = activeOptionBarId.value === 'workbench' ? 'none' : 'workbench';
    }
}

function handleWorkbenchOptionSelect(config?: BenchtopOptionLocalisedConfig): void {
    activeBenchtopOptionConfig.value = config;
    activeOptionBarId.value = 'none';
    activePaneId.value = 'workbench';
}

// Pane splitter UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// Knowledge pane UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleKnowledgeToggle(): void {
    if (displayIsWide.value) {
        // Don't close if it's the only open panel
        if (!knowledgePaneIsHidden.value && workbenchPaneIsHidden.value) return;
        knowledgePaneIsHidden.value = !knowledgePaneIsHidden.value;
        activePaneId.value = knowledgePaneIsHidden.value ? 'workbench' : 'knowledge';
    } else {
        activeOptionBarId.value = activeOptionBarId.value === 'knowledge' ? 'none' : 'knowledge';
    }
}

function handleKnowledgeOptionSelect(): void {
    activeOptionBarId.value = 'none';
    activePaneId.value = 'knowledge';
}
</script>

<template>
    <div class="bg-surface text-content fixed inset-0 flex" :class="{ 'select-none': paneSplitterIsDragging }">
        <!-- Workbench toggle fixed in top left corner; always visible -->
        <ActionButton :aria-label="workbenchPaneToggleAriaLabel" class="fixed top-1.75 left-3 z-40" variant="iconLarge" @click="handleWorkbenchToggle">
            <DPULogoIcon />
        </ActionButton>

        <!-- Knowledge toggle fixed in top right corner; always visible -->
        <ActionButton :aria-label="knowledgePaneToggleAriaLabel" class="fixed top-1.75 right-3 z-40" variant="iconLarge" @click="handleKnowledgeToggle">
            <KnowledgeIcon />
        </ActionButton>

        <!-- Account action -->
        <div class="fixed right-3 bottom-6 z-40 flex flex-col items-end gap-y-1.5">
            <div v-if="sessionPanelIsVisible" class="border-boundary bg-backdrop flex flex-col gap-y-1 rounded-md border px-4 py-3 shadow-sm">
                <div class="text-muted text-sm font-medium">Appearance</div>
                <div>Dark | Light | System</div>
                <div class="text-muted text-sm font-medium">Full screen</div>
                <div>Toggle...</div>
                <div class="text-muted text-sm font-medium">Language</div>
                <div>English | Español</div>
                <div class="text-muted text-sm font-medium">Region</div>
                <div>English | Español</div>
                <Separator class="my-1" />
                <div>Manage account...</div>
                <Separator class="my-1" />
                <div>Sign in/up/out</div>
            </div>

            <ActionButton class="p-0!" variant="avatar" @click="sessionPanelIsVisible = !sessionPanelIsVisible">
                <img v-if="avatarUrl" :src="avatarUrl" />
            </ActionButton>

            <!-- <ActionButton variant="iconLarge" @click="sessionPanelIsVisible = !sessionPanelIsVisible">
                <SessionIcon />
            </ActionButton> -->
        </div>

        <!-- Authentication dialog activated using url parameter 'dialog=auth' -->
        <AuthDialog v-if="authDialogIsVisible" />

        <!-- Left pane: Workbench (option bar + workbench body) -->
        <div :class="workbenchPaneClasses" :style="workbenchPaneStyle">
            <WorkbenchOptionBar
                class="flex-none"
                :is-open-in-narrow-display="activeOptionBarId === 'workbench'"
                :is-wide-display="displayIsWide"
                :session-is-authenticated="sessionState.isAuthenticated"
                @select="handleWorkbenchOptionSelect"
            />
            <div class="flex-1 overflow-y-hidden">
                <RouterView v-slot="{ Component }">
                    <component
                        :is="Component"
                        :active-benchtop-option-config="activeBenchtopOptionConfig"
                        :is-assist-panel-open-in-wide-display="true"
                        :is-wide-display="displayIsWide"
                    />
                </RouterView>
            </div>
        </div>

        <!-- Vertical splitter for resizing panes -->
        <div
            v-if="paneSplitterIsVisible"
            class="border-boundary hover:bg-separator h-full w-1 flex-none cursor-col-resize border-x transition-colors"
            @pointerdown="handleSplitterPointerDown"
            @pointermove="handleSplitterPointerMove"
            @pointerup="handleSplitterPointerUp"
        />

        <!-- Right pane: Knowledge (knowledge body + option bar) -->
        <div :class="knowledgePaneClasses">
            <KnowledgePanel class="flex-1" :is-wide-display="displayIsWide" />
            <KnowledgeOptionBar
                class="flex-none"
                :is-open-in-narrow-display="activeOptionBarId === 'knowledge'"
                :is-wide-display="displayIsWide"
                :session-is-authenticated="sessionState.isAuthenticated"
                @select="handleKnowledgeOptionSelect"
            />
        </div>
    </div>
</template>
