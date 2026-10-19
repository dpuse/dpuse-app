<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, onMounted, ref, watch } from 'vue';
import { debounceFilter, useLocalStorage } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { defineLazyComponent } from '@/utilities/index.ts';
import { t } from '@/state/locale';
import { TEXT } from './App_.json';
import { useDialogs } from '@/state/dialogs';
import { appFailures, clearAppFailures, retryAppFailures } from '@/state/errors';
import {
    type AppPaneId,
    appPaneSplitterIsVisible,
    assistantPaneIsOpen,
    assistantPaneIsVisible,
    assistantPaneWasOpened,
    currentAppPaneId,
    setPaneOpenState,
    studioPaneIsOpen,
    studioPaneIsVisible,
    studioPaneWasOpened
} from '@/state/appPanes';
import { initialiseServices, signInFollowsGuestUse } from '@/state/session';
import { isPWA, isSafariBrowser, viewportIsWide } from '@/state/device';
import { loadAssistantLayout, prefetchAssistant } from '@/features/assistant/assistantLoaders';
import { moduleUpdateIsAvailable, newAppVersionIsAvailable } from '@/state/appVersion';
import { navigationPendingDepth, replaceRouteQuery } from '@/router';

// ── Static Components
import AssistantPaneToggle from '@/features/assistant/AssistantPaneToggle.vue'; // Static, because it is always visible.
import Dialog from '@/components/ui/dialog/Dialog.vue'; // Static, so the frame opens while the dialog's own chunk loads.
import ErrorDialog from '@/components/ui/error/ErrorDialog.vue'; // Static, so it can show even when a chunk fails to load.
import NewVersionNotice from '@/components/ui/NewVersionNotice.vue'; // Static, because once a new version is deployed this version's chunks are gone.
import RouterViewTransition from '@/components/ui/RouterViewTransition.vue'; // Static, so its spinner can show while other chunks load.
import SessionButton from '@/features/session/SessionButton.vue'; // Static, because it is always visible.
import StudioPaneToggle from '@/features/studio/StudioPaneToggle.vue'; // Static, because it is always visible.

// ── Dynamic Components
const AssistantLayout = defineLazyComponent(loadAssistantLayout, 'AssistantLayout');
const GuestWorkNotice = defineLazyComponent(() => import('@/features/session/GuestWorkNotice.vue'), 'GuestWorkNotice', { hasPlaceholder: false });
const OptionBar = defineLazyComponent(() => import('@/features/studio/options/OptionBar.vue'), 'OptionBar', { hasPlaceholder: false });
const PaneSplitter = defineLazyComponent(() => import('@/components/ui/PaneSplitter.vue'), 'PaneSplitter', { hasPlaceholder: false });

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PANE_SPLITTER_DEFAULT_PERCENT = 50;
const PANE_SPLITTER_PERCENT_KEY = 'dpuse-paneSplitterPercent';
const PANE_SPLITTER_PERCENT_SAVE_DEBOUNCE_MS = 250;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Route
const route = useRoute();
const router = useRouter();

// ── Studio Option Bar
const studioOptionBarIsVisible = ref(false); // Narrow displays only, because a wide one always shows the option bar.

// ── Pane Splitter ─ A drag fires on every pointer move, so the write to storage is debounced and the last value saved.
const paneSplitterPercent = useLocalStorage(PANE_SPLITTER_PERCENT_KEY, PANE_SPLITTER_DEFAULT_PERCENT, {
    eventFilter: debounceFilter(PANE_SPLITTER_PERCENT_SAVE_DEBOUNCE_MS),
    serializer: { read: (value) => Number(value) || PANE_SPLITTER_DEFAULT_PERCENT, write: String }
});

// ── Dialogs
const { currentDialogConfig, currentDialogId, closeDialog } = useDialogs();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Failures ─ 'Retry' is offered when any failure can be retried. 'Reload App' and closing the app-level failure
// dialog are always offered.
const appFailuresCanRetry = computed(() => appFailures.value.some((failure) => failure.retry != null));

// ── Viewport ─ Safari colours its toolbars to match the page, so without these lines nothing marks where the page
// starts or ends. Chrome, Edge and Firefox draw their own toolbar edges. The installed app (PWA) has no bottom toolbar,
// so it gets no bottom line.
const viewportRequiresTopEdgeLine = isSafariBrowser();
const viewportRequiresBottomEdgeLine = !isPWA && isSafariBrowser();

// ── Studio Pane ─ The studio's 'RouterView' is the outermost one, so its spinner shows only while its own view loads.
// Views nested inside it show their own. The key changes only with that view, so the fade plays when the view changes
// but not when a nested view or query parameter does.
const studioPaneStyle = computed(() => {
    // Half the splitter comes off each pane, so an even split leaves the two the same width.
    return assistantPaneIsVisible.value ? { minWidth: '0', width: `calc(${String(paneSplitterPercent.value)}% - var(--pane-splitter-width) / 2)` } : { minWidth: '0', flex: '1' };
});
const studioViewIsLoading = computed(() => navigationPendingDepth.value === 0);
const studioViewKey = computed(() => route.matched.find((record) => record.components?.default)?.path);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    initialiseServices();
});

// The first navigation always finishes after mount, because 'main.ts' mounts the app without waiting for the router.
// That keeps the first paint from waiting on the route's chunk, and means 'onMounted' always runs before this.
router
    .isReady()
    // eslint-disable-next-line unicorn/prefer-await -- top-level await in <script setup> suspends the component; .then() keeps the mount non-blocking.
    .then(() => {
        // Runs once, after the first navigation, to set up the panes from the URL. The studio opens unless the URL has
        // only the assistant open.
        setPaneOpenState('studio', route.query.studio === '1' || route.query.assistant !== '1');
        setPaneOpenState('assistant', route.query.assistant === '1');
        currentAppPaneId.value = establishCurrentPaneId();
    })
    // eslint-disable-next-line unicorn/prefer-await, unicorn/prefer-top-level-await -- top-level await in <script setup> suspends the component; .catch() keeps the mount non-blocking.
    .catch(() => {
        // If the router fails to start, the studio pane is shown.
        setPaneOpenState('studio', true);
        setPaneOpenState('assistant', false);
    });

// Writes the panes to the URL only when they change, so clicking or scrolling in the pane already in front writes
// nothing.
watch([currentAppPaneId, assistantPaneIsOpen, studioPaneIsOpen], syncPaneQuery);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleToggleStudioPane(): void {
    if (viewportIsWide.value) {
        // A pane that is the only one showing stays open.
        if (studioPaneIsVisible.value && !assistantPaneIsVisible.value) return;
        setPaneOpenState('studio', !studioPaneIsOpen.value);
        return;
    }

    // On a narrow viewport with the studio already in front, the button opens and closes the option bar instead.
    if (studioPaneIsVisible.value) {
        studioOptionBarIsVisible.value = !studioOptionBarIsVisible.value;
        return;
    }

    setPaneOpenState('studio', true);
}

function handleToggleAssistantPane(): void {
    if (viewportIsWide.value) {
        // A pane that is the only one showing stays open.
        if (assistantPaneIsVisible.value && !studioPaneIsVisible.value) return;
        setPaneOpenState('assistant', !assistantPaneIsOpen.value);
        return;
    }

    if (assistantPaneIsVisible.value) return; // The assistant pane is already in front, so there is nothing to do.

    setPaneOpenState('assistant', true);
}

// Pointing at or focusing the assistant toggle signals an open is likely, so the pane's chunks start loading then.
// Pressing it does too, because a touch screen has no hover.
function handlePrefetchAssistantPane(): void {
    if (assistantPaneWasOpened.value) return; // Already loaded when it first opened.
    void prefetchAssistant();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function establishCurrentPaneId(): AppPaneId {
    if (!studioPaneIsOpen.value) return 'assistant';
    if (!assistantPaneIsOpen.value) return 'studio';
    return route.query.pane === 'assistant' ? 'assistant' : 'studio';
}

// Saves which panes are open, not which are showing, so a reload or shared link restores both even when a narrow
// display shows only one.
function syncPaneQuery(): void {
    void replaceRouteQuery(router, {
        studio: studioPaneIsOpen.value ? '1' : undefined,
        assistant: assistantPaneIsOpen.value ? '1' : undefined,
        // Which pane is in front, only needed when both are open.
        pane: studioPaneIsOpen.value && assistantPaneIsOpen.value ? currentAppPaneId.value : undefined
    });
}
</script>

<template>
    <div class="flex bg-surface pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-content" :class="isPWA ? 'h-screen w-screen' : 'h-dvh w-dvw'" data-region="App">
        <!-- App Failures ─ Failures that no pane or panel shows itself, in the app-level failure dialog. -->
        <ErrorDialog v-if="appFailures.length > 0" :can-retry="appFailuresCanRetry" :failures="appFailures" is-dismissible @dismiss="clearAppFailures" @retry="retryAppFailures" />

        <!-- Notices ─ Stacked above the bottom row of controls, so two at once never overlap. The stack spans the width
             but lets clicks through, so the page beside a notice still works. -->
        <div
            class="pointer-events-none fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(var(--safe-bottom-offset)+2.5rem+0.75rem)] left-[calc(1rem+env(safe-area-inset-left))] z-40 flex flex-col gap-2 sm:items-end"
        >
            <!-- New Version Notice ─ For users who stay on one screen, since moving to another loads the new version. -->
            <NewVersionNotice v-if="newAppVersionIsAvailable || moduleUpdateIsAvailable" />

            <!-- Guest Work Notice ─ Only after signing in from a page used signed out, not on a page that loads signed
                 in. -->
            <GuestWorkNotice v-if="signInFollowsGuestUse" />
        </div>

        <!-- Top Edge Line ─ Full width on wide viewports, lying exactly over the option bar's own line. -->
        <div v-if="viewportIsWide && viewportRequiresTopEdgeLine" class="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-50 h-px bg-separator" />

        <!-- Bottom Edge Line ─ Fixed across the full width, against Safari's bottom toolbar. -->
        <div v-if="viewportRequiresBottomEdgeLine" class="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-px bg-separator" />

        <!-- Studio Pane Toggle ─ Fixed in top left corner above option bar or panes and always visible. -->
        <StudioPaneToggle :is-open="studioPaneIsVisible" @click="handleToggleStudioPane" />

        <!-- Assistant Pane Toggle ─ Fixed in top right corner above panes and always visible. -->
        <AssistantPaneToggle
            :is-open="assistantPaneIsVisible"
            @click="handleToggleAssistantPane"
            @focus="handlePrefetchAssistantPane"
            @pointerdown="handlePrefetchAssistantPane"
            @pointerenter="handlePrefetchAssistantPane"
        />

        <!-- Session Button ─ Fixed in bottom left corner and always visible. -->
        <SessionButton :studio-option-bar-is-visible="studioOptionBarIsVisible" />

        <!-- Studio Option Bar ─ Rendered here when viewport is narrow. -->
        <OptionBar v-if="!viewportIsWide" class="z-30" :is-visible="studioOptionBarIsVisible" @continue="studioOptionBarIsVisible = false" />

        <!-- Studio Pane ─ Mounted the first time it opens, then hidden rather than removed, so it keeps its state. -->
        <main
            v-if="studioPaneWasOpened"
            :hidden="!studioPaneIsVisible"
            class="@container grid h-full"
            :class="viewportIsWide ? 'grid-cols-[65px_1fr]' : 'grid-cols-1'"
            data-region="StudioPane"
            :style="studioPaneStyle"
            @focusin="currentAppPaneId = 'studio'"
            @pointerdown="currentAppPaneId = 'studio'"
            @scroll.capture="currentAppPaneId = 'studio'"
        >
            <!-- Studio Option Bar ─ Rendered here when viewport is wide. -->
            <OptionBar v-if="viewportIsWide" class="overflow-y-hidden" />

            <!-- 'col-start-2' keeps the content in the second column while the option bar is still loading, which
                 avoids layout shift. -->
            <div class="min-h-0 min-w-0" :class="{ 'col-start-2': viewportIsWide }" data-region="StudioContent">
                <RouterViewTransition v-slot="{ component }" :is-loading="studioViewIsLoading">
                    <component :is="component" :key="studioViewKey" />
                </RouterViewTransition>
            </div>
        </main>

        <!-- Pane Splitter ─ Only when both panes are visible. The top margin starts it below the status bar, level with
             the pane headers. -->
        <PaneSplitter v-if="appPaneSplitterIsVisible" v-model="paneSplitterPercent" class="mt-[env(safe-area-inset-top)]" />

        <!-- Assistant Pane ─ Mounted the first time it opens, then hidden rather than removed, so it keeps its
             state. It is the page's main content when the studio is hidden, and side content beside it otherwise. -->
        <component
            :is="studioPaneIsVisible ? 'aside' : 'main'"
            v-if="assistantPaneWasOpened"
            :hidden="!assistantPaneIsVisible"
            :aria-label="t(TEXT, 'assistantPane.aria')"
            class="min-w-0 flex-1"
            data-region="AssistantPane"
            @focusin="currentAppPaneId = 'assistant'"
            @pointerdown="currentAppPaneId = 'assistant'"
            @scroll.capture="currentAppPaneId = 'assistant'"
        >
            <AssistantLayout :studio-pane-is-hidden="!studioPaneIsVisible" />
        </component>

        <!-- Dialog ─ Opened by the URL 'dlg' parameter. Owned here so its frame appears at once, while the dialog's own
             chunk loads. -->
        <Dialog
            v-if="currentDialogConfig"
            :key="currentDialogId"
            is-open
            :max-width="currentDialogConfig.maxWidth"
            :min-height="currentDialogConfig.minHeight"
            :sizing="currentDialogConfig.sizing"
            @close="closeDialog"
        >
            <component :is="currentDialogConfig.component" />
        </Dialog>
    </div>
</template>
