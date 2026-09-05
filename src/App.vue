<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, onMounted, ref, type Component as VueComponent, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { defineAsyncPanel } from '@/utilities/index.ts';
import { initialiseServices } from '@/state/session';
import { navigationPendingDepth } from '@/router';
import { throwOnFault } from '@/observability/faultInjection';
import { appFailures, clearAppFailures, retryAppFailures } from '@/state/errors';
import { assistantPaneIsVisible, isPWA, studioPaneIsVisible, viewportIsWide } from '@/state/appLayout';

// ── Static Components
import AssistantToggle from './features/assistant/_components/AssistantToggle.vue';
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue'; // Stands in for a studio layout mid-navigation.
import DialogShell from '@/components/ui/dialog/DialogShell.vue'; // Renders before the dialog it frames.
import ErrorShell from '@/components/ui/error/ErrorShell.vue'; // Can be no delay when rendering.
import SessionButton from '@/features/session/SessionButton.vue'; // Always visible.
import StudioToggle from './features/studio/_components/StudioToggle.vue';

// ── Dynamic Components
const AccountPanel = defineAsyncPanel(() => import('@/features/session/accountPanel/AccountPanel.vue'), 'AccountPanel');
const AuthPanel = defineAsyncPanel(() => import('@/features/session/authPanel/AuthPanel.vue'), 'AuthPanel');
const ConnectionPanel = defineAsyncPanel(() => import('@/features/studio/connectionPanel/ConnectionPanel.vue'), 'ConnectionPanel', { simulation: { delayMs: 3000 } });
const AssistantLayout = defineAsyncPanel(() => import('@/features/assistant/_components/AssistantLayout.vue'), 'AssistantLayout');
const PaneSplitter = defineAsyncPanel(() => import('@/components/ui/PaneSplitter.vue'), 'PaneSplitter', { hasPlaceholder: false });
const OptionBar = defineAsyncPanel(() => import('@/features/studio/options/OptionBar.vue'), 'OptionBar', { hasPlaceholder: false });

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The frame is rendered from the URL alone, before the dialog's own chunk exists, so its shape has to be known here.
// Only the outer chrome is listed: each dialog still owns its own header, keeping its title with its translations.
interface DialogConfig {
    component: VueComponent;
    maxWidth?: string;
    minHeight?: string;
    sizing: 'full' | 'reserved';
}
const DIALOG_CONFIGS: Record<'account' | 'auth' | 'connection', DialogConfig> = {
    account: { component: AccountPanel, sizing: 'full' },
    // Reserved rather than fixed: the sign-in body moves between steps of differing height, and the minimum is the
    // tallest of the short ones, so the frame neither collapses around the loading spinner nor towers over the first step.
    auth: { component: AuthPanel, maxWidth: '24rem', minHeight: '250px', sizing: 'reserved' },
    connection: { component: ConnectionPanel, sizing: 'full' }
};

const PANE_SPLITTER_DEFAULT_PERCENT = 50;
const PANE_SPLITTER_WIDTH = 6; // The value must match the 'w-1.5' class on the root element in 'PaneSplitter.vue'.
const PANE_SPLITTER_PERCENT_KEY = 'dpuse-paneSplitterPercent';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeAppPaneId = ref<'studio' | 'assistant' | undefined>();

const assistantPaneActivated = ref(false); // Keeps the component alive so it doesn't lose its internal state when hidden.
const assistantPaneIsActive = ref(false); // On narrow displays a pane can be active but not visible.

const paneSplitterPercent = ref(establishPaneSplitterPercent());

const route = useRoute();
const router = useRouter();

const studioOptionBarIsVisible = ref(false);
const studioPaneActivated = ref(false); // Keeps the component alive so it doesn't lose its internal state when hidden.
const studioPaneIsActive = ref(false); // On narrow displays a pane can be active but not visible.

// ── Derived State - Dialogs ──────────────────────────────────────────────────────────────────────────────────────────

const activeDialogId = computed(() => {
    const dialogId = String(route.query.dlg ?? '');
    return Object.hasOwn(DIALOG_CONFIGS, dialogId) ? (dialogId as keyof typeof DIALOG_CONFIGS) : undefined;
});
const activeDialogConfig = computed(() => (activeDialogId.value ? DIALOG_CONFIGS[activeDialogId.value] : undefined));

// ── Derived State - Panes ────────────────────────────────────────────────────────────────────────────────────────────

const assistantPaneStyle = computed(() => {
    if (assistantPaneIsVisible.value) return { minWidth: '0', flex: '1' };
    return { width: '0' };
});

const paneSplitterIsVisible = computed(() => studioPaneIsVisible.value && assistantPaneIsVisible.value);

// This is the outermost 'RouterView', so it hosts level 0 and only shows a spinner when the studio layout itself is
// being replaced. A panel changing inside the layout reports a deeper level and is covered by that layout instead.
const studioLayoutIsLoading = computed(() => navigationPendingDepth.value === 0);

const studioPaneStyle = computed(() => {
    if (!studioPaneIsVisible.value) return { width: '0' };
    if (assistantPaneIsVisible.value) return { minWidth: '0', width: `calc(${String(paneSplitterPercent.value)}% - ${String(PANE_SPLITTER_WIDTH / 2)}px)` };
    return { minWidth: '0', flex: '1' };
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

router
    .isReady()
    // eslint-disable-next-line unicorn/prefer-await -- top-level await in <script setup> suspends the component; .then() keeps the mount non-blocking.
    .then(() => {
        // The initial navigation has fully completed. This block intentionally runs once to bootstrap the pane states from the initial URL.
        studioPaneActivated.value = studioPaneIsActive.value = route.query.sState === '1' || route.query.aState !== '1';
        assistantPaneActivated.value = assistantPaneIsActive.value = route.query.aState === '1';
        activeAppPaneId.value = studioPaneActivated.value ? 'studio' : 'assistant';
        establishActivePaneId(viewportIsWide.value);
    })
    // eslint-disable-next-line unicorn/prefer-await, unicorn/prefer-top-level-await -- top-level await in <script setup> suspends the component; .catch() keeps the mount non-blocking.
    .catch(() => {
        // Router failed to initialise — fall back to showing the studio pane.
        studioPaneActivated.value = studioPaneIsActive.value = studioPaneIsVisible.value = true;
        assistantPaneActivated.value = assistantPaneIsActive.value = assistantPaneIsVisible.value = false;
        activeAppPaneId.value = 'studio';
    });

onMounted(() => {
    if (import.meta.env.DEV) throwOnFault('vue'); // Thrown from the root component, which no 'ErrorBoundary' wraps, so it reaches 'app.config.errorHandler'.
    initialiseServices();
});

watch(viewportIsWide, (newViewportIsWide) => {
    if (activeAppPaneId.value != null) establishActivePaneId(newViewportIsWide);
});

watch(paneSplitterPercent, (newPaneSplitterPercent) => {
    localStorage.setItem(PANE_SPLITTER_PERCENT_KEY, String(newPaneSplitterPercent));
});

// ── Event Handlers - Studio Option Bar ────────────────────────────────────────────────────────────────────────────

function handleStudioOptionBarHide(): void {
    if (viewportIsWide.value) return;
    studioOptionBarIsVisible.value = false;
}

// ── Event Handlers - Assistant Pane/Panels ───────────────────────────────────────────────────────────────────────────

function handleToggleAssistantPane(): void {
    if (viewportIsWide.value) {
        if (assistantPaneIsVisible.value && !studioPaneIsVisible.value) return; // Don't close the assistant pane if it's the only one visible.
        toggleAssistantPane();
        activeAppPaneId.value = assistantPaneIsVisible.value ? 'assistant' : 'studio';
        return;
    }

    // Display is narrow, pane already visible — its own task bar handles navigation, so there's nothing to toggle.
    if (assistantPaneIsVisible.value) return;

    // Display is narrow, switching to this pane — close other option bar first if open.
    activeAppPaneId.value = 'assistant';
    studioOptionBarIsVisible.value = false;
    studioPaneIsVisible.value = false;
    toggleAssistantPane();
}

function toggleAssistantPane(): void {
    if ('aView' in route.query) {
        // Then - toggle assistant pane, ensure assistant pane is activated (may be first time), and update route properties.
        assistantPaneIsActive.value = assistantPaneIsVisible.value = !assistantPaneIsVisible.value;
        if (assistantPaneIsActive.value) assistantPaneActivated.value = true;
        void router.replace({ query: { ...route.query, sState: studioPaneIsVisible.value ? 1 : undefined, aState: assistantPaneIsVisible.value ? 1 : undefined } });
    } else {
        // Else - assistant pane has never been activated, active and navigate to last 'about' route.
        assistantPaneActivated.value = assistantPaneIsActive.value = assistantPaneIsVisible.value = true;
        void router.replace({ query: { ...route.query, aView: 'about', sState: studioPaneIsVisible.value ? 1 : undefined, aState: 1 } });
    }
}

// ── Event Handlers - Studio Pane ──────────────────────────────────────────────────────────────────────────────────

function handleToggleStudioPane(): void {
    if (viewportIsWide.value) {
        if (studioPaneIsVisible.value && !assistantPaneIsVisible.value) return; // Don't close the studio pane if it's the only one visible.
        toggleStudioPane();
        activeAppPaneId.value = studioPaneIsVisible.value ? 'studio' : 'assistant';
        return;
    }

    // Display is narrow, pane already visible — toggle its option bar.
    if (studioPaneIsVisible.value) {
        studioOptionBarIsVisible.value = !studioOptionBarIsVisible.value;
        return;
    }

    // Display is narrow, switching to this pane — close the assistant pane first if open.
    activeAppPaneId.value = 'studio';
    assistantPaneIsVisible.value = false;
    toggleStudioPane();
}

function toggleStudioPane(): void {
    studioPaneIsActive.value = studioPaneIsVisible.value = !studioPaneIsVisible.value;
    if (studioPaneIsActive.value) studioPaneActivated.value = true;
    void router.replace({ query: { ...route.query, sState: studioPaneIsVisible.value ? 1 : undefined, aState: assistantPaneIsVisible.value ? 1 : undefined } });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function establishActivePaneId(isViewportIsWide: boolean): void {
    // eslint-disable-next-line sonarjs/no-selector-parameter -- splitting into two methods would just move the if/else to the caller.
    if (isViewportIsWide) {
        studioPaneIsVisible.value = studioPaneIsActive.value;
        assistantPaneIsVisible.value = assistantPaneIsActive.value;
    } else {
        studioPaneIsVisible.value = studioPaneIsActive.value && activeAppPaneId.value === 'studio';
        assistantPaneIsVisible.value = assistantPaneIsActive.value && activeAppPaneId.value === 'assistant';
    }
}

function establishPaneSplitterPercent(): number {
    try {
        return Number(localStorage.getItem(PANE_SPLITTER_PERCENT_KEY)) || PANE_SPLITTER_DEFAULT_PERCENT;
    } catch {
        return PANE_SPLITTER_DEFAULT_PERCENT;
    }
}
</script>

<template>
    <div class="flex bg-surface pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-content" :class="isPWA ? 'h-screen w-screen' : 'h-dvh w-dvw'" data-region="App">
        <!--
          z-10: Content: StudioPane (includes fixed OptionBar), PaneSplitter & AssistantPane
          z-20: topFadeOut, assistantPaneToggle
          z-30: OptionBar (floating)
          z-40: studioPaneToggle
          z-49: SessionButton
          Dialogs and the SessionMenu are not listed: 'showModal()' puts them in the browser's top layer, above every
          z-index here, and their own '::backdrop' is the scrim.
          z-80: App-level failures (a failure with no region of its own)
          -->

        <!-- Failures with no region of their own: an uncaught error, a navigation that never reached a view, a service
             the app loads for itself. A failure fills the space it owns, and these own no region, so their space is
             the screen and they are shown as a modal. One body listing all of them rather than one each — losing the
             network fails every service independently, and four notices would read as four problems instead of the
             one that happened.
             Retry is offered only when one of them carried something to run again — most did not, being a service
             loaded once at startup or an error no region ever contained, and for those a fresh document is the only
             recovery there is. -->
        <ErrorShell
            v-if="appFailures.length > 0"
            :can-retry="appFailures.some((failure) => failure.retry != null)"
            :failures="appFailures"
            is-dismissible
            owns-screen
            @dismiss="clearAppFailures"
            @retry="retryAppFailures"
        />

        <!-- Studio Pane Toggle - Fixed in top left corner and always visible. -->
        <StudioToggle @click="handleToggleStudioPane" />

        <!-- Assistant Pane Toggle - Fixed in top right corner and always visible. -->
        <AssistantToggle @click="handleToggleAssistantPane" />

        <!-- Session Button - Fixed in bottom left corner and always visible. -->
        <SessionButton class="fixed bottom-(--safe-bottom-offset) left-(--safe-left-offset) z-49" :studio-option-bar-is-visible="studioOptionBarIsVisible" />

        <!-- Studio Option Bar - Only rendered here when viewport is narrow. -->
        <OptionBar v-if="!viewportIsWide" class="z-30" :is-visible="studioOptionBarIsVisible" @continue="handleStudioOptionBarHide" />

        <!-- Studio Pane - Contains studio layout (via RouterView). Rendered once studio pane is activated and visible. -->
        <div
            v-if="studioPaneActivated"
            v-show="studioPaneIsVisible"
            class="grid h-full"
            :class="viewportIsWide ? 'grid-cols-[65px_1fr]' : 'grid-cols-1'"
            data-region="StudioPane"
            :style="[studioPaneStyle, { 'container-type': 'inline-size' }]"
            @pointerdown="activeAppPaneId = 'studio'"
            @scroll.capture="activeAppPaneId = 'studio'"
        >
            <!-- Studio Option Bar - Only rendered here when viewport is wide. -->
            <OptionBar v-if="viewportIsWide" class="overflow-y-hidden" @continue="handleStudioOptionBarHide" />

            <!-- 'col-start-2' required to ensure content is place in 2nd grid column when async sidebar unresolved. Minimises CLS WebVital metric. -->
            <div class="min-h-0 min-w-0" :class="{ 'col-start-2': viewportIsWide }" data-region="studio-content">
                <!-- The spinner must stay outside the transition. Put it inside as a 'v-if' branch and the incoming
                     route component renders as an empty comment and never appears, because the update that follows the
                     spinner's leave does not pick up the resolved component. -->
                <RouterView v-slot="{ Component }">
                    <ComponentLoadingSpinner v-if="studioLayoutIsLoading" />
                    <Transition v-else name="action-fade" mode="out-in">
                        <component :is="Component" :key="$route.matched.find((r) => r.components?.default)?.path" />
                    </Transition>
                </RouterView>
            </div>
        </div>

        <!-- Pane (Vertical) Splitter - Rendered if viewport is wide and both panes are shown. -->
        <PaneSplitter v-if="paneSplitterIsVisible" v-model="paneSplitterPercent" class="h-full" />

        <!-- Assistant Pane - Contains assistant layout. Rendered once assistant pane is activated and visible. -->
        <div
            v-if="assistantPaneActivated"
            v-show="assistantPaneIsVisible"
            data-region="AssistantPane"
            :style="assistantPaneStyle"
            @pointerdown="activeAppPaneId = 'assistant'"
            @scroll.capture="activeAppPaneId = 'assistant'"
        >
            <AssistantLayout :studio-pane-is-hidden="!studioPaneIsVisible" />
        </div>

        <!-- Dialogs - Modal wrapper for dialogs which are activated using URL 'dlg' parameter. This wrapper is owned
             here rather than by each dialog so it can appear immediately, while the dialog's own chunk is still
             loading. Its body then fills in behind the spinner without the frame remounting, so there is no second
            fade and nothing shifts. -->
        <DialogShell
            v-if="activeDialogConfig"
            :key="activeDialogId"
            :is-open="true"
            :max-width="activeDialogConfig.maxWidth"
            :min-height="activeDialogConfig.minHeight"
            :sizing="activeDialogConfig.sizing"
        >
            <component :is="activeDialogConfig.component" />
        </DialogShell>
    </div>
</template>
