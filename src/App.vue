<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, onMounted, ref, watch } from 'vue';
import { type LocationQueryRaw, useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { defineAsyncPanel } from '@/utilities/index.ts';
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

// ── Static Components
import AssistantPaneToggle from '@/features/assistant/_components/AssistantPaneToggle.vue'; // Always visible.
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue'; // Required immediately if there is a delay, cannot wait for it to load.
import DialogShell from '@/components/ui/dialog/DialogShell.vue'; // Required immediately if a dialog is to be shown, cannot wait for it to load.
import ErrorShell from '@/components/ui/error/ErrorShell.vue'; // Required immediately if there is an error, cannot wait for it to load.
import SessionButton from '@/features/session/SessionButton.vue'; // Always visible.
import StudioPaneToggle from '@/features/studio/_components/StudioPaneToggle.vue'; // Always visible.

// ── Dynamic Components
const AssistantLayout = defineAsyncPanel(() => import('@/features/assistant/_components/AssistantLayout.vue'), 'AssistantLayout');
const StudioOptionBar = defineAsyncPanel(() => import('@/features/studio/options/StudioOptionBar.vue'), 'StudioOptionBar', { hasPlaceholder: false });
const StudioPaneSplitter = defineAsyncPanel(() => import('@/features/studio/_components/StudioPaneSplitter.vue'), 'StudioPaneSplitter', { hasPlaceholder: false });

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const STUDIO_PANE_SPLITTER_DEFAULT_PERCENT = 50;
const STUDIO_PANE_SPLITTER_PERCENT_KEY = 'dpuse-paneSplitterPercent'; // The stored name is deliberately not the constant's: changing it would discard every split already saved.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The pane model itself is not here: it lives in '@/state/appLayout' alongside the viewport it depends on, because the
// studio and assistant headers read it too. What is left here is the chrome this component alone owns.
const paneModelIsBootstrapped = ref(false); // Reading the URL counts as a change; see the watcher that records the panes.
const route = useRoute();
const router = useRouter();

// The dialog catalogue itself is in '@/state/dialogs', so a feature can add one without editing the root component.
// What is left here is the single frame every one of them is rendered in.
const { activeDialogConfig, activeDialogId, closeDialog } = useDialogs();

const studioOptionBarIsVisible = ref(false); // Narrow displays only; on a wide one the option bar is always in the pane.
const studioPaneSplitterPercent = ref(establishStudioPaneSplitterPercent());

// ── Derived State - Failures ─────────────────────────────────────────────────────────────────────────────────────────

// Most app-level failures carry nothing to run again — a service loaded once at startup, or an error no region ever
// contained — and for those a fresh document is the only recovery there is. One that does is enough to offer retry.
const appFailuresCanRetry = computed(() => appFailures.value.some((failure) => failure.retry != null));

// ── Derived State - Panes ────────────────────────────────────────────────────────────────────────────────────────────

const assistantPaneStyle = computed(() => {
    if (assistantPaneIsVisible.value) return { minWidth: '0', flex: '1' };
    return { width: '0' };
});

// This is the outermost 'RouterView', so it hosts level 0 and only shows a spinner when the studio layout itself is
// being replaced. A panel changing inside the layout reports a deeper level and is covered by that layout instead.
const studioLayoutIsLoading = computed(() => navigationPendingDepth.value === 0);

// What the transition below remounts on. Keyed to the deepest matched record that actually renders something, so a
// genuine change of layout plays the fade while a move between panels inside one layout, or a change of query
// parameter, leaves it alone.
const studioLayoutKey = computed(() => route.matched.find((record) => record.components?.default)?.path);

const studioPaneSplitterIsVisible = computed(() => studioPaneIsVisible.value && assistantPaneIsVisible.value);

const studioPaneStyle = computed(() => {
    if (!studioPaneIsVisible.value) return { width: '0' };
    // Half the splitter comes off each pane, so an even split leaves the two the same width.
    if (assistantPaneIsVisible.value) return { minWidth: '0', width: `calc(${String(studioPaneSplitterPercent.value)}% - var(--pane-splitter-width) / 2)` };
    return { minWidth: '0', flex: '1' };
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

router
    .isReady()
    // eslint-disable-next-line unicorn/prefer-await -- top-level await in <script setup> suspends the component; .then() keeps the mount non-blocking.
    .then(() => {
        // The initial navigation has fully completed, so the URL can be read. Runs once, to bootstrap the pane model.
        // The studio is the default pane: it opens unless the assistant was explicitly the one left showing.
        setPaneActiveState('studio', route.query.sState === '1' || route.query.aState !== '1');
        setPaneActiveState('assistant', route.query.aState === '1');
        activeAppPaneId.value = establishActivePaneId();
        paneModelIsBootstrapped.value = true;
    })
    // eslint-disable-next-line unicorn/prefer-await, unicorn/prefer-top-level-await -- top-level await in <script setup> suspends the component; .catch() keeps the mount non-blocking.
    .catch(() => {
        // Router failed to initialise — fall back to showing the studio pane.
        setPaneActiveState('studio', true);
        setPaneActiveState('assistant', false);
        activeAppPaneId.value = 'studio';
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

watch(studioPaneSplitterPercent, (newStudioPaneSplitterPercent) => {
    try {
        localStorage.setItem(STUDIO_PANE_SPLITTER_PERCENT_KEY, String(newStudioPaneSplitterPercent));
    } catch {
        // Storage can refuse a write — Safari in private browsing, or a full quota. The split still works for this
        // document, it just will not be remembered, and a throw here would escape the watcher and be raised as an
        // app-level failure. Losing a preference is not worth a modal.
    }
});

// ── Event Handlers - Studio Option Bar ───────────────────────────────────────────────────────────────────────────────

// Only the narrow option bar can be hidden. The wide one is laid out inside the studio pane and is always there, which
// is why only the narrow instance below binds this.
function handleStudioOptionBarHide(): void {
    studioOptionBarIsVisible.value = false;
}

// ── Event Handlers - Panes ───────────────────────────────────────────────────────────────────────────────────────────

// A pointer, a scroll, or focus arriving anywhere in a pane makes it the one the user is working in. On a narrow
// display that is already the case, since only the front pane can be reached at all. It is on a wide display that this
// earns its keep: both are reachable, and the last one used is what the narrow layout falls back to if the display
// shrinks. Three signals rather than one because none covers the others — focus alone misses a click on anything not
// focusable, and the pointer alone misses a reader who moves between the panes with the keyboard.
function handlePaneActivate(paneId: AppPaneId): void {
    activeAppPaneId.value = paneId;
}

function handleToggleAssistantPane(): void {
    if (viewportIsWide.value) {
        if (assistantPaneIsVisible.value && !studioPaneIsVisible.value) return; // Don't close the assistant pane if it's the only one visible.
        setPaneActiveState('assistant', !assistantPaneIsActive.value);
        activeAppPaneId.value = assistantPaneIsActive.value ? 'assistant' : 'studio';
        return;
    }

    // Display is narrow, pane already visible — its own task bar handles navigation, so there's nothing to toggle.
    if (assistantPaneIsVisible.value) return;

    // Display is narrow, so bringing this pane to the front is itself what hides the studio. Its option bar has to be
    // closed by hand, being fixed over the whole screen rather than laid out inside the pane it belongs to.
    studioOptionBarIsVisible.value = false;
    setPaneActiveState('assistant', true);
    activeAppPaneId.value = 'assistant';
}

function handleToggleStudioPane(): void {
    if (viewportIsWide.value) {
        if (studioPaneIsVisible.value && !assistantPaneIsVisible.value) return; // Don't close the studio pane if it's the only one visible.
        setPaneActiveState('studio', !studioPaneIsActive.value);
        activeAppPaneId.value = studioPaneIsActive.value ? 'studio' : 'assistant';
        return;
    }

    // Display is narrow, pane already visible — toggle its option bar.
    if (studioPaneIsVisible.value) {
        studioOptionBarIsVisible.value = !studioOptionBarIsVisible.value;
        return;
    }

    // Display is narrow, so bringing this pane to the front is itself what hides the assistant.
    setPaneActiveState('studio', true);
    activeAppPaneId.value = 'studio';
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Which pane is in front. It decides what a narrow display shows, so it has to be settled even where both panes are
// open; 'pane' carries that, since the open flags alone cannot say which of two was on top.
function establishActivePaneId(): AppPaneId {
    if (!studioPaneIsActive.value) return 'assistant';
    if (!assistantPaneIsActive.value) return 'studio';
    return route.query.pane === 'assistant' ? 'assistant' : 'studio';
}

function establishStudioPaneSplitterPercent(): number {
    try {
        return Number(localStorage.getItem(STUDIO_PANE_SPLITTER_PERCENT_KEY)) || STUDIO_PANE_SPLITTER_DEFAULT_PERCENT;
    } catch {
        return STUDIO_PANE_SPLITTER_DEFAULT_PERCENT;
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
        sState: studioPaneIsActive.value ? '1' : undefined,
        aState: assistantPaneIsActive.value ? '1' : undefined,
        // Which of the two is in front, needed only where both are open and the display can show just one. With a
        // single pane open the flags above already say which, so it is left off rather than stated twice.
        pane: studioPaneIsActive.value && assistantPaneIsActive.value ? activeAppPaneId.value : undefined
    };

    // The assistant reopens on the view it was last on, which it reads from 'aView'. The first time it opens there is
    // nothing to reopen, so it starts at 'about'.
    if (assistantPaneIsActive.value && !('aView' in query)) query.aView = 'chat';

    void router.replace({ query }).catch(() => {
        // Already reported by 'router.onError'.
    });
}
</script>

<template>
    <div class="flex bg-surface pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-content" :class="isPWA ? 'h-screen w-screen' : 'h-dvh w-dvw'" data-region="App">
        <!--
          z-10: Content: StudioPane (includes the wide StudioOptionBar), StudioPaneSplitter & AssistantPane
          z-20: topFadeOut, assistantPaneToggle
          z-30: StudioOptionBar (the narrow one, floating over the panes as a sibling of them)
          z-40: studioPaneToggle
          z-49: SessionButton
          z-80: App-level failures (a failure with no region of its own)
          Dialogs and the SessionMenu are not listed: 'showModal()' puts them in the browser's top layer, above every
          z-index here, and their own '::backdrop' is the scrim.
          -->

        <!-- The failures no region ever owned: an uncaught error, a navigation that never reached a view, a service the
             app loads for itself. Nothing smaller than the screen is theirs, which is what 'owns-screen' says, and this
             is the only call site that passes more than one failure. 'ErrorShell' documents the rest of the contract. -->
        <ErrorShell
            v-if="appFailures.length > 0"
            :can-retry="appFailuresCanRetry"
            :failures="appFailures"
            is-dismissible
            owns-screen
            @dismiss="clearAppFailures"
            @retry="retryAppFailures"
        />

        <!-- Studio Pane Toggle - Fixed in top left corner and always visible. -->
        <StudioPaneToggle @click="handleToggleStudioPane" />

        <!-- Assistant Pane Toggle - Fixed in top right corner and always visible. -->
        <AssistantPaneToggle @click="handleToggleAssistantPane" />

        <!-- Session Button - Fixed in bottom left corner and always visible. -->
        <SessionButton :studio-option-bar-is-visible="studioOptionBarIsVisible" />

        <!-- Studio Option Bar, narrow. Declared out here and not in the studio pane with its wide twin, which looks
             like duplication worth collapsing and is not: on a narrow display this slides in as a 'fixed' full-screen
             overlay, and the pane carries '@container', whose containment makes it the containing block for 'fixed'
             descendants. Moved inside, the overlay would size itself to the pane rather than the viewport.
             The two also sit in different places by design — one is a floating overlay, the other a grid column — so
             they carry different classes, and only this one can be dismissed. -->
        <StudioOptionBar v-if="!viewportIsWide" class="z-30" :is-visible="studioOptionBarIsVisible" @continue="handleStudioOptionBarHide" />

        <!-- Studio Pane - Contains studio layout (via RouterView). Rendered once studio pane is activated and visible. -->
        <div
            v-if="studioPaneWasActivated"
            v-show="studioPaneIsVisible"
            class="@container grid h-full"
            :class="viewportIsWide ? 'grid-cols-[65px_1fr]' : 'grid-cols-1'"
            data-region="StudioPane"
            :style="studioPaneStyle"
            @focusin="handlePaneActivate('studio')"
            @pointerdown="handlePaneActivate('studio')"
            @scroll.capture="handlePaneActivate('studio')"
        >
            <!-- Studio Option Bar, wide. A column of the pane's grid, always present, so nothing dismisses it. See the
                 note on its narrow twin above for why the two are not one. -->
            <StudioOptionBar v-if="viewportIsWide" class="overflow-y-hidden" />

            <!-- 'col-start-2' required to ensure content is placed in the 2nd grid column while the async option bar is
                 still unresolved. Minimises the CLS WebVital metric. -->
            <div class="min-h-0 min-w-0" :class="{ 'col-start-2': viewportIsWide }" data-region="StudioContent">
                <!-- The spinner must stay outside the transition. Put it inside as a 'v-if' branch and the incoming
                     route component renders as an empty comment and never appears, because the update that follows the
                     spinner's leave does not pick up the resolved component. -->
                <RouterView v-slot="{ Component }">
                    <ComponentLoadingSpinner v-if="studioLayoutIsLoading" />
                    <Transition v-else name="action-fade" mode="out-in">
                        <component :is="Component" :key="studioLayoutKey" />
                    </Transition>
                </RouterView>
            </div>
        </div>

        <!-- Pane (Vertical) Splitter - Rendered only while both panes are on screen, which a narrow display never does. -->
        <StudioPaneSplitter v-if="studioPaneSplitterIsVisible" v-model="studioPaneSplitterPercent" class="h-full" />

        <!-- Assistant Pane - Contains assistant layout. Rendered once assistant pane is activated and visible. -->
        <div
            v-if="assistantPaneWasActivated"
            v-show="assistantPaneIsVisible"
            data-region="AssistantPane"
            :style="assistantPaneStyle"
            @focusin="handlePaneActivate('assistant')"
            @pointerdown="handlePaneActivate('assistant')"
            @scroll.capture="handlePaneActivate('assistant')"
        >
            <AssistantLayout :studio-pane-is-hidden="!studioPaneIsVisible" />
        </div>

        <!-- Dialog Shell - The app's one modal frame, for every dialog activated by the URL 'dlg' parameter. Owned here
             rather than by each dialog so it can appear immediately, while the dialog's own chunk is still loading.
             Its body then fills in behind the spinner without the frame remounting, so there is no second fade and
             nothing shifts. -->
        <DialogShell
            v-if="activeDialogConfig"
            :key="activeDialogId"
            :is-open="true"
            :max-width="activeDialogConfig.maxWidth"
            :min-height="activeDialogConfig.minHeight"
            :sizing="activeDialogConfig.sizing"
            @close="closeDialog"
        >
            <component :is="activeDialogConfig.component" />
        </DialogShell>
    </div>
</template>
