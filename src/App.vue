<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, onMounted, ref, watch } from 'vue';
import { type LocationQueryRaw, useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { initialiseServices } from '@/state/session';
import { navigationPendingDepth } from '@/router';
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
import { debounce, defineAsyncPanel, isSafariBrowser } from '@/utilities/index.ts';

// ── Static Components
import AssistantPaneToggle from '@/features/assistant/_components/AssistantPaneToggle.vue'; // Always visible.
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue'; // Required immediately if there is a delay, cannot wait for it to load.
import Dialog from '@/components/ui/dialog/Dialog.vue'; // Required immediately if a dialog is to be shown, cannot wait for it to load.
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue'; // Required immediately if there is an error, cannot wait for it to load.
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

const paneModelIsBootstrapped = ref(false); // Reading the URL counts as a change; see the watcher that records the panes.
const route = useRoute();
const router = useRouter();

const { activeDialogConfig, activeDialogId, closeDialog } = useDialogs();

const paneSplitterPercent = ref(establishPaneSplitterPercent());
const studioOptionBarIsVisible = ref(false); // Narrow displays only; on a wide one the option bar is always in the pane.

// ── Derived State - Environment ──────────────────────────────────────────────────────────────────────────────────────

// Safari tints its toolbars to match the page, so nothing shows where the page starts or ends without a line of its
// own; Chrome and Edge draw their own toolbar edge. The top line is for wide viewports, where the panes sit beside the
// option bar, which draws its own. The toolbar can sit at the bottom, which the installed app has none of. Where it
// cannot be placed there, the line only marks the edge of the screen.
const hasBottomEdgeLine = !isPWA && isSafariBrowser();
const hasTopEdgeLine = isSafariBrowser();

// ── Derived State - Failures ─────────────────────────────────────────────────────────────────────────────────────────

// Most app-level failures carry nothing to run again — a service loaded once at startup, or an error no region ever
// contained — and for those a fresh document is the only recovery there is. One that does is enough to offer retry.
const appFailuresCanRetry = computed(() => appFailures.value.some((failure) => failure.retry != null));

// ── Derived State - Panes ────────────────────────────────────────────────────────────────────────────────────────────

const assistantPaneStyle = computed(() => {
    if (assistantPaneIsVisible.value) return { minWidth: '0', flex: '1' };
    return { width: '0' };
});

const paneSplitterIsVisible = computed(() => studioPaneIsVisible.value && assistantPaneIsVisible.value);

// This is the outermost 'RouterView', so it hosts level 0 and only shows a spinner when the studio layout itself is
// being replaced. A panel changing inside the layout reports a deeper level and is covered by that layout instead.
const studioLayoutIsLoading = computed(() => navigationPendingDepth.value === 0);

// What the transition below remounts on. Keyed to the shallowest matched record that actually renders something —
// 'route.matched' runs root to leaf, so this is the depth-0 layout this 'RouterView' owns — so a genuine change of
// layout plays the fade while a move between panels inside one layout, or a change of query parameter, leaves it
// alone.
const studioLayoutKey = computed(() => route.matched.find((record) => record.components?.default)?.path);

const studioPaneStyle = computed(() => {
    if (!studioPaneIsVisible.value) return { width: '0' };
    // Half the splitter comes off each pane, so an even split leaves the two the same width.
    if (assistantPaneIsVisible.value) return { minWidth: '0', width: `calc(${String(paneSplitterPercent.value)}% - var(--pane-splitter-width) / 2)` };
    return { minWidth: '0', flex: '1' };
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

router
    .isReady()
    // eslint-disable-next-line unicorn/prefer-await -- top-level await in <script setup> suspends the component; .then() keeps the mount non-blocking.
    .then(() => {
        // The initial navigation has fully completed, so the URL can be read. Runs once, to bootstrap the pane model.
        // The studio is the default pane: it opens unless the assistant was explicitly the one left showing.
        setPaneActiveState('studio', route.query.studio === '1' || route.query.assistant !== '1');
        setPaneActiveState('assistant', route.query.assistant === '1');
        activeAppPaneId.value = establishActivePaneId();
        paneModelIsBootstrapped.value = true;
    })
    // eslint-disable-next-line unicorn/prefer-await, unicorn/prefer-top-level-await -- top-level await in <script setup> suspends the component; .catch() keeps the mount non-blocking.
    .catch(() => {
        // Router failed to initialise — fall back to showing the studio pane.
        setPaneActiveState('studio', true);
        setPaneActiveState('assistant', false);
        paneModelIsBootstrapped.value = true;
    });

onMounted(() => {
    if (import.meta.env.DEV) throwOnFault('vue'); // Thrown from the root component, which no 'ErrorBoundary' wraps, so it reaches 'app.config.errorHandler'.
    initialiseServices();
});

// Records the layout in the URL whenever it actually changes, rather than from each handler that might have changed it.
// Assigning a ref the value it already holds is not a change, so working within one pane writes nothing however much
// the pointer moves; only a real switch does. Silent until the bootstrap above has run, because reading the URL sets
// these too, and reacting to that would write the defaults straight back into a link that had none.
watch([activeAppPaneId, assistantPaneIsActive, studioPaneIsActive], () => {
    if (paneModelIsBootstrapped.value) syncPaneQuery();
});

// Debounced: this fires on every pointermove while dragging, and only the value the drag settles on is worth
// persisting.
watch(
    paneSplitterPercent,
    debounce((newPaneSplitterPercent: number): void => {
        try {
            localStorage.setItem(PANE_SPLITTER_PERCENT_KEY, String(newPaneSplitterPercent)); // Remember pane splitter percent.
        } catch {
            // Storage can refuse a write (private browsing, or full quota). Split works but preference is not remembered.
        }
    }, PANE_SPLITTER_PERCENT_SAVE_DEBOUNCE_MS)
);

// ── Event Handlers - Panes ───────────────────────────────────────────────────────────────────────────────────────────

function handleToggleAssistantPane(): void {
    if (viewportIsWide.value) {
        if (assistantPaneIsVisible.value && !studioPaneIsVisible.value) return; // Don't close the assistant pane if it's the only one visible.
        setPaneActiveState('assistant', !assistantPaneIsActive.value); // Toggle assistant pane.
        return;
    }

    if (assistantPaneIsVisible.value) return; // Viewport is narrow so ignore assistant pane toggle if already visible.

    setPaneActiveState('assistant', true); // Show assistant pane.
}

function handleToggleStudioPane(): void {
    if (viewportIsWide.value) {
        if (studioPaneIsVisible.value && !assistantPaneIsVisible.value) return; // Don't close the studio pane if it's the only one visible.
        setPaneActiveState('studio', !studioPaneIsActive.value); // Toggle studio pane.
        return;
    }

    if (studioPaneIsVisible.value) {
        studioOptionBarIsVisible.value = !studioOptionBarIsVisible.value; // Toggle studio option bar.
        return; // Viewport is narrow so ignore studio pane toggle if already visible.
    }

    setPaneActiveState('studio', true); // Show studio pane.
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function establishActivePaneId(): AppPaneId {
    if (!studioPaneIsActive.value) return 'assistant';
    if (!assistantPaneIsActive.value) return 'studio';
    return route.query.pane === 'assistant' ? 'assistant' : 'studio';
}

function establishPaneSplitterPercent(): number {
    try {
        return Number(localStorage.getItem(PANE_SPLITTER_PERCENT_KEY)) || PANE_SPLITTER_DEFAULT_PERCENT;
    } catch {
        return PANE_SPLITTER_DEFAULT_PERCENT;
    }
}

// Records which panes are open, so a reload or a shared link opens on the same layout. Open rather than showing: a
// narrow display has room for only one at a time, and writing what is on screen would throw away the fact that the
// other was open too, so widening after a reload would give back one pane where there had been two.
// Driven by the watcher above rather than called from the handlers, which is what keeps it off the paths that change
// nothing and guarantees the whole model has settled before any of it is written.
function syncPaneQuery(): void {
    const query: LocationQueryRaw = {
        ...route.query,
        studio: studioPaneIsActive.value ? '1' : undefined,
        assistant: assistantPaneIsActive.value ? '1' : undefined,
        // Which of the two is in front, needed only where both are open and the display can show just one. With a
        // single pane open the flags above already say which, so it is left off rather than stated twice.
        pane: studioPaneIsActive.value && assistantPaneIsActive.value ? activeAppPaneId.value : undefined
    };

    void router.replace({ query }).catch(() => {
        // Already reported by 'router.onError'.
    });
}
</script>

<template>
    <div class="flex bg-surface pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-content" :class="isPWA ? 'h-screen w-screen' : 'h-dvh w-dvw'" data-region="App">
        <!-- Error Shell - Show uncaught errors, failed navigations and service load failures using fullscreen dialog. -->
        <ErrorNotice
            v-if="appFailures.length > 0"
            :can-retry="appFailuresCanRetry"
            :failures="appFailures"
            is-dismissible
            owns-screen
            @dismiss="clearAppFailures"
            @retry="retryAppFailures"
        />

        <!-- Top Edge Line - Fixed across the full width on wide viewports. Covers the option bar's own line exactly. -->
        <div v-if="viewportIsWide && hasTopEdgeLine" class="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-50 h-px bg-separator" />

        <!-- Bottom Edge Line - Fixed across the full width, against Safari's bottom toolbar. -->
        <div v-if="hasBottomEdgeLine" class="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-px bg-separator" />

        <!-- Studio Pane Toggle - Fixed in top left corner above option bar or panes and always visible. -->
        <StudioPaneToggle @click="handleToggleStudioPane" />

        <!-- Assistant Pane Toggle - Fixed in top right corner above panes and always visible. -->
        <AssistantPaneToggle @click="handleToggleAssistantPane" />

        <!-- Session Button - Fixed in bottom left corner and always visible. -->
        <SessionButton :studio-option-bar-is-visible="studioOptionBarIsVisible" />

        <!-- Studio Option Bar - Rendered here when viewport is narrow. -->
        <OptionBar v-if="!viewportIsWide" class="z-30" :is-visible="studioOptionBarIsVisible" @continue="studioOptionBarIsVisible = false" />

        <!-- Studio Pane - Rendered first time studio pane is activated and shown when pane is visible. Contains studio layout (via RouterView). -->
        <div
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

            <!-- 'col-start-2' required to ensure content is placed in the 2nd grid column while the async option bar is
                 still unresolved. Minimises the CLS WebVital metric. -->
            <div class="min-h-0 min-w-0" :class="{ 'col-start-2': viewportIsWide }" data-region="StudioContent">
                <RouterView v-slot="{ Component }">
                    <!-- The spinner must stay outside the transition. -->
                    <ComponentLoadingSpinner v-if="studioLayoutIsLoading" />
                    <Transition v-else name="action-fade" mode="out-in">
                        <component :is="Component" :key="studioLayoutKey" />
                    </Transition>
                </RouterView>
            </div>
        </div>

        <!-- Pane Splitter (Vertical) - Only rendered when both panes are visible. Starts below the status bar, where the
             pane headers start; the splitter stretches, so the margin shortens it rather than pushing it off screen. -->
        <PaneSplitter v-if="paneSplitterIsVisible" v-model="paneSplitterPercent" class="mt-[env(safe-area-inset-top)]" />

        <!-- Assistant Pane - Rendered first time assistant pane is activated and shown when pane is visible. Contains
             assistant layout. -->
        <div
            v-if="assistantPaneWasActivated"
            v-show="assistantPaneIsVisible"
            data-region="AssistantPane"
            :style="assistantPaneStyle"
            @focusin="activeAppPaneId = 'assistant'"
            @pointerdown="activeAppPaneId = 'assistant'"
            @scroll.capture="activeAppPaneId = 'assistant'"
        >
            <AssistantLayout :studio-pane-is-hidden="!studioPaneIsVisible" />
        </div>

        <!-- Dialog Shell - Modal shell for all dialogs. Dialogs are activated by the URL 'dlg' parameter. Owned here
             so it can appear immediately, while the dialog's own chunk is still loading. -->
        <Dialog
            v-if="activeDialogConfig"
            :key="activeDialogId"
            :is-open="true"
            :max-width="activeDialogConfig.maxWidth"
            :min-height="activeDialogConfig.minHeight"
            :sizing="activeDialogConfig.sizing"
            @close="closeDialog"
        >
            <component :is="activeDialogConfig.component" />
        </Dialog>
    </div>
</template>
