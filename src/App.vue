<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, onMounted, ref, watch } from 'vue';
import { debounceFilter, useLocalStorage } from '@vueuse/core';
import { type LocationQueryRaw, useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { initialiseServices } from '@/state/session';
import { t } from '@/state/locale';
import { TEXT } from './App_.json';
import { throwOnFault } from '@/observability/faultInjection';
import { useDialogs } from '@/state/dialogs';
import {
    activeAppPaneId,
    type AppPaneId,
    assistantPaneIsActive,
    assistantPaneIsVisible,
    assistantPaneWasActivated,
    isPWA,
    setPaneActiveState,
    studioPaneIsActive,
    studioPaneIsVisible,
    studioPaneWasActivated,
    viewportIsWide
} from '@/state/appLayout';
import { appFailures, clearAppFailures, retryAppFailures } from '@/state/errors';
import { defineAsyncPanel, isSafariBrowser } from '@/utilities/index.ts';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';

// ── Static Components
import AssistantPaneToggle from '@/features/assistant/_components/AssistantPaneToggle.vue'; // Always visible.
import Dialog from '@/components/ui/dialog/Dialog.vue'; // Static, so the frame opens while the dialog's own chunk loads.
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue'; // Static, so it can show even when a chunk fails to load.
import RouterViewTransition from '@/components/ui/RouterViewTransition.vue'; // Static, so its spinner can show while other chunks load.
import SessionButton from '@/features/session/SessionButton.vue'; // Always visible.
import StudioPaneToggle from '@/features/studio/_components/StudioPaneToggle.vue'; // Always visible.

// ── Dynamic Components
const AssistantLayout = defineAsyncPanel(() => import('@/features/assistant/_components/AssistantLayout.vue'), 'AssistantLayout');
const OptionBar = defineAsyncPanel(() => import('@/features/studio/options/OptionBar.vue'), 'OptionBar', { hasPlaceholder: false });
const PaneSplitter = defineAsyncPanel(() => import('@/components/ui/PaneSplitter.vue'), 'PaneSplitter', { hasPlaceholder: false });

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PANE_SPLITTER_DEFAULT_PERCENT = 50;
const PANE_SPLITTER_PERCENT_KEY = 'dpuse-paneSplitterPercent';
const PANE_SPLITTER_PERCENT_SAVE_DEBOUNCE_MS = 250;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

const { activeDialogConfig, activeDialogId, closeDialog } = useDialogs();

// Pane splitter — a drag fires on every pointer move, so the write to storage is debounced and only the value the
// drag settles on is saved.
const paneSplitterPercent = useLocalStorage(PANE_SPLITTER_PERCENT_KEY, PANE_SPLITTER_DEFAULT_PERCENT, {
    eventFilter: debounceFilter(PANE_SPLITTER_PERCENT_SAVE_DEBOUNCE_MS),
    serializer: { read: (value) => Number(value) || PANE_SPLITTER_DEFAULT_PERCENT, write: String }
});

const studioOptionBarIsVisible = ref(false); // Narrow displays only, because a wide one always shows the option bar.

// ── Derived State - Environment ──────────────────────────────────────────────────────────────────────────────────────

// Safari colours its toolbars to match the page, so without these lines nothing marks where the page starts or ends.
// Chrome and Edge draw their own toolbar edges. The installed app has no bottom toolbar, so it gets no bottom line.
const hasBottomEdgeLine = !isPWA && isSafariBrowser();
const hasTopEdgeLine = isSafariBrowser();

// ── Derived State - Failures ─────────────────────────────────────────────────────────────────────────────────────────

// Retry is offered if any failure can be retried; the others can only recover by reloading the page.
const appFailuresCanRetry = computed(() => appFailures.value.some((failure) => failure.retry != null));

// ── Derived State - Panes ────────────────────────────────────────────────────────────────────────────────────────────

const assistantPaneStyle = computed(() => {
    return assistantPaneIsVisible.value ? { minWidth: '0', flex: '1' } : { width: '0' };
});

const paneSplitterIsVisible = computed(() => studioPaneIsVisible.value && assistantPaneIsVisible.value);

// This is the outermost 'RouterView', so it shows a spinner only while the studio layout itself loads. Panels inside
// the layout show their own.
const studioLayoutIsLoading = computed(() => navigationPendingDepth.value === 0);

// Keyed to the top-level layout, so the fade plays when the layout changes but not when a panel or query parameter
// does.
const studioLayoutKey = computed(() => route.matched.find((record) => record.components?.default)?.path);

const studioPaneStyle = computed(() => {
    if (!studioPaneIsVisible.value) return { width: '0' };
    // Half the splitter comes off each pane, so an even split leaves the two the same width.
    return assistantPaneIsVisible.value ? { minWidth: '0', width: `calc(${String(paneSplitterPercent.value)}% - var(--pane-splitter-width) / 2)` } : { minWidth: '0', flex: '1' };
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

router
    .isReady()
    // eslint-disable-next-line unicorn/prefer-await -- top-level await in <script setup> suspends the component; .then() keeps the mount non-blocking.
    .then(() => {
        // Runs once, after the first navigation, to set up the panes from the URL. The studio opens unless the URL has
        // only the assistant open.
        setPaneActiveState('studio', route.query.studio === '1' || route.query.assistant !== '1');
        setPaneActiveState('assistant', route.query.assistant === '1');
        activeAppPaneId.value = establishActivePaneId();
    })
    // eslint-disable-next-line unicorn/prefer-await, unicorn/prefer-top-level-await -- top-level await in <script setup> suspends the component; .catch() keeps the mount non-blocking.
    .catch(() => {
        // If the router fails to start, the studio pane is shown.
        setPaneActiveState('studio', true);
        setPaneActiveState('assistant', false);
    });

onMounted(() => {
    if (import.meta.env.DEV) throwOnFault('vue'); // Thrown from the root component, which no 'ErrorBoundary' wraps, so it reaches 'app.config.errorHandler'.
    initialiseServices();
});

// Writes the panes to the URL only when they change, so moving the pointer within a pane writes nothing.
watch([activeAppPaneId, assistantPaneIsActive, studioPaneIsActive], syncPaneQuery);

// ── Event Handlers - Panes ───────────────────────────────────────────────────────────────────────────────────────────

function handleToggleAssistantPane(): void {
    if (viewportIsWide.value) {
        if (assistantPaneIsVisible.value && !studioPaneIsVisible.value) return; // Don't close the assistant pane if it's the only one visible.
        setPaneActiveState('assistant', !assistantPaneIsActive.value);
        return;
    }

    if (assistantPaneIsVisible.value) return; // Already in front on a narrow viewport, so there is nothing to do.

    setPaneActiveState('assistant', true);
}

function handleToggleStudioPane(): void {
    if (viewportIsWide.value) {
        if (studioPaneIsVisible.value && !assistantPaneIsVisible.value) return; // Don't close the studio pane if it's the only one visible.
        setPaneActiveState('studio', !studioPaneIsActive.value);
        return;
    }

    // On a narrow viewport with the studio already in front, the button opens and closes the option bar instead.
    if (studioPaneIsVisible.value) {
        studioOptionBarIsVisible.value = !studioOptionBarIsVisible.value;
        return;
    }

    setPaneActiveState('studio', true);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function establishActivePaneId(): AppPaneId {
    if (!studioPaneIsActive.value) return 'assistant';
    if (!assistantPaneIsActive.value) return 'studio';
    return route.query.pane === 'assistant' ? 'assistant' : 'studio';
}

// Saves which panes are open, not which are showing, so a reload or shared link restores both even when a narrow
// display shows only one.
function syncPaneQuery(): void {
    const query: LocationQueryRaw = {
        ...route.query,
        studio: studioPaneIsActive.value ? '1' : undefined,
        assistant: assistantPaneIsActive.value ? '1' : undefined,
        // Which pane is in front, only needed when both are open.
        pane: studioPaneIsActive.value && assistantPaneIsActive.value ? activeAppPaneId.value : undefined
    };

    void ignoreReportedNavigationFailure(router.replace({ query }));
}
</script>

<template>
    <div class="flex bg-surface pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-content" :class="isPWA ? 'h-screen w-screen' : 'h-dvh w-dvw'" data-region="App">
        <!-- App Failures - Uncaught errors, failed navigations and service load failures, shown full screen. -->
        <ErrorNotice
            v-if="appFailures.length > 0"
            :can-retry="appFailuresCanRetry"
            :failures="appFailures"
            is-dismissible
            owns-screen
            @dismiss="clearAppFailures"
            @retry="retryAppFailures"
        />

        <!-- Top Edge Line - Full width on wide viewports, lying exactly over the option bar's own line. -->
        <div v-if="viewportIsWide && hasTopEdgeLine" class="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-50 h-px bg-separator" />

        <!-- Bottom Edge Line - Fixed across the full width, against Safari's bottom toolbar. -->
        <div v-if="hasBottomEdgeLine" class="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-px bg-separator" />

        <!-- Studio Pane Toggle - Fixed in top left corner above option bar or panes and always visible. -->
        <StudioPaneToggle :is-open="studioPaneIsVisible" @click="handleToggleStudioPane" />

        <!-- Assistant Pane Toggle - Fixed in top right corner above panes and always visible. -->
        <AssistantPaneToggle :is-open="assistantPaneIsVisible" @click="handleToggleAssistantPane" />

        <!-- Session Button - Fixed in bottom left corner and always visible. -->
        <SessionButton :studio-option-bar-is-visible="studioOptionBarIsVisible" />

        <!-- Studio Option Bar - Rendered here when viewport is narrow. -->
        <OptionBar v-if="!viewportIsWide" class="z-30" :is-visible="studioOptionBarIsVisible" @continue="studioOptionBarIsVisible = false" />

        <!-- Studio Pane - Mounted the first time it opens, then hidden rather than removed, so it keeps its state. -->
        <main
            v-if="studioPaneWasActivated"
            v-show="studioPaneIsVisible"
            class="@container grid h-full"
            :class="viewportIsWide ? 'grid-cols-[65px_1fr]' : 'grid-cols-1'"
            data-region="StudioPane"
            :style="studioPaneStyle"
            @focusin="activeAppPaneId = 'studio'"
            @pointerdown="activeAppPaneId = 'studio'"
            @scroll.capture="activeAppPaneId = 'studio'"
        >
            <!-- Studio Option Bar - Rendered here when viewport is wide. -->
            <OptionBar v-if="viewportIsWide" class="overflow-y-hidden" />

            <!-- 'col-start-2' keeps the content in the second column while the option bar is still loading, which
                 avoids layout shift. -->
            <div class="min-h-0 min-w-0" :class="{ 'col-start-2': viewportIsWide }" data-region="StudioContent">
                <RouterViewTransition v-slot="{ component }" :is-loading="studioLayoutIsLoading">
                    <component :is="component" :key="studioLayoutKey" />
                </RouterViewTransition>
            </div>
        </main>

        <!-- Pane Splitter - Only when both panes are visible. The top margin starts it below the status bar, level with
             the pane headers. -->
        <PaneSplitter v-if="paneSplitterIsVisible" v-model="paneSplitterPercent" class="mt-[env(safe-area-inset-top)]" />

        <!-- Assistant Pane - Mounted the first time it opens, then hidden rather than removed, so it keeps its
             state. -->
        <component
            :is="studioPaneIsVisible ? 'aside' : 'main'"
            v-if="assistantPaneWasActivated"
            v-show="assistantPaneIsVisible"
            :aria-label="t(TEXT, 'assistantPane.aria')"
            data-region="AssistantPane"
            :style="assistantPaneStyle"
            @focusin="activeAppPaneId = 'assistant'"
            @pointerdown="activeAppPaneId = 'assistant'"
            @scroll.capture="activeAppPaneId = 'assistant'"
        >
            <AssistantLayout :studio-pane-is-hidden="!studioPaneIsVisible" />
        </component>

        <!-- Dialog - Opened by the URL 'dlg' parameter. Owned here so its frame appears at once, while the dialog's own
             chunk loads. -->
        <Dialog
            v-if="activeDialogConfig"
            :key="activeDialogId"
            is-open
            :max-width="activeDialogConfig.maxWidth"
            :min-height="activeDialogConfig.minHeight"
            :sizing="activeDialogConfig.sizing"
            @close="closeDialog"
        >
            <component :is="activeDialogConfig.component" />
        </Dialog>
    </div>
</template>
