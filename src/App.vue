<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { InfoIcon, LibraryBigIcon, MessageCircleMoreIcon } from '@lucide/vue';
import { useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { initialiseServices } from '@/state/session';
import { load } from '@/state/component';
import T from './App.json';
import { t } from '@/state/locale';
import { assistantPaneIsVisible, contentScrollPosition, sessionMenuIsOpen, studioPaneIsVisible, viewportIsWide } from '@/state/appLayout';
import { navigationIsActive, navigationIsDelayed } from '@/state/navigation';

// ── Local Components - Static
import AssistantLogo from '@/components/branding/AssistantLogo.vue'; // Always visible.
import type { AssistantViewId } from '@/assistant/AssistantLayout.vue';
import Button from '@/components/ui/button/Button.vue'; // Required by studio and assistant toggle buttons which are always visible.
import DPUseLogo from '@/components/branding/DPUseLogo.vue'; // Always visible.
import LoadingMask from '@/components/framework/LoadingMask.vue'; // Required so no delay when rendering.
import ProgressBar from '@/components/framework/ProgressBar.vue'; // Required so no delay when rendering.
import SessionButton from '@/session/SessionButton.vue'; // Always visible.

// ── Local Components - Dynamic
const AccountDialog = defineAsyncComponent(load('AccountDialog', () => import('@/session/accountDialog/AccountDialog.vue')));
const AuthDialog = defineAsyncComponent(load('AuthDialog', () => import('@/session/authDialog/AuthDialog.vue')));
const ConnectionDialog = defineAsyncComponent(load('ConnectionDialog', () => import('@/studio/connectionDialog/ConnectionDialog.vue')));
const AssistantLayout = defineAsyncComponent(load('AssistantLayout', () => import('@/assistant/AssistantLayout.vue')));
const PaneSplitter = defineAsyncComponent(load('PaneSplitter', () => import('@/components/ui/PaneSplitter.vue')));
const StudioOptionBar = defineAsyncComponent(load('StudioOptionBar', () => import('@/studio/optionBar/StudioOptionBar.vue')));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PANE_SPLITTER_DEFAULT_PERCENT = 50;
const PANE_SPLITTER_PERCENT_KEY = 'dpuse-paneSplitterPercent';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeAppPaneId = ref<'studio' | 'assistant' | undefined>();

const assistantOptionBarIsVisible = ref(false);
const assistantPaneActivated = ref(false); // Keeps the component alive so it doesn't lose its internal state when hidden.
const assistantPaneIsActive = ref(false); // On narrow displays a pane can be active but not visible.

const paneSplitterPercent = ref(establishPaneSplitterPercent());

const route = useRoute();
const router = useRouter();

const studioOptionBarIsVisible = ref(false);
const studioPaneActivated = ref(false); // Keeps the component alive so it doesn't lose its internal state when hidden.
const studioPaneIsActive = ref(false); // On narrow displays a pane can be active but not visible.

// ── Derived State - Dialogs ──────────────────────────────────────────────────────────────────────────────────────────

const accountDialogIsVisible = computed(() => route.query.dlg === 'account');
const authDialogIsVisible = computed(() => route.query.dlg === 'auth');
const connectionDialogIsVisible = computed(() => route.query.dlg === 'connection');
const dialogIsActive = computed(() => accountDialogIsVisible.value || authDialogIsVisible.value || connectionDialogIsVisible.value);
const modalIsActive = computed(() => accountDialogIsVisible.value || authDialogIsVisible.value || connectionDialogIsVisible.value || sessionMenuIsOpen.value);

// ── Derived State - Panes ────────────────────────────────────────────────────────────────────────────────────────────

const assistantPaneStyle = computed(() => {
    if (assistantPaneIsVisible.value) return { minWidth: '0', flex: '1' };
    return { width: '0' };
});

const paneSplitterIsVisible = computed(() => studioPaneIsVisible.value && assistantPaneIsVisible.value);

const studioPaneStyle = computed(() => {
    if (!studioPaneIsVisible.value) return { width: '0' };
    if (assistantPaneIsVisible.value) return { minWidth: '0', width: paneSplitterPercent.value + '%' };
    return { minWidth: '0', flex: '1' };
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

router
    .isReady()
    // eslint-disable-next-line unicorn/prefer-await -- top-level await in <script setup> suspends the component; .then() keeps mount non-blocking.
    .then(() => {
        // The initial navigation has fully completed. This block intentionally runs once to bootstrap pane state from the initial URL.
        studioPaneActivated.value = studioPaneIsActive.value = route.path !== '/';
        assistantPaneActivated.value = assistantPaneIsActive.value = route.query.kState === '1' && 'kView' in route.query;
        activeAppPaneId.value = studioPaneActivated.value ? 'studio' : 'assistant';
        establishActivePaneId(viewportIsWide.value);
    })
    // eslint-disable-next-line unicorn/prefer-await, unicorn/prefer-top-level-await -- top-level await in <script setup> suspends the component; .catch() keeps mount non-blocking.
    .catch(() => {
        // Router failed to initialise — fall back to showing the studio pane.
        studioPaneActivated.value = studioPaneIsActive.value = studioPaneIsVisible.value = true;
        assistantPaneActivated.value = assistantPaneIsActive.value = assistantPaneIsVisible.value = false;
        activeAppPaneId.value = 'studio';
    });

onMounted(() => initialiseServices());

watch(viewportIsWide, (newViewportIsWide) => {
    if (activeAppPaneId.value != null) establishActivePaneId(newViewportIsWide);
});

watch(paneSplitterPercent, (newPaneSplitterPercent) => localStorage.setItem(PANE_SPLITTER_PERCENT_KEY, String(newPaneSplitterPercent)));

// ── Event Handlers - Assistant Pane/Panels ───────────────────────────────────────────────────────────────────────────

function handleSelectAssistantPanel(assistantViewId: AssistantViewId): void {
    activeAppPaneId.value = 'assistant';
    assistantPaneIsActive.value = assistantPaneIsVisible.value = route.query.kView !== assistantViewId || !assistantPaneIsVisible.value;
    if (assistantPaneIsActive.value) assistantPaneActivated.value = true;
    router.replace({ query: { ...route.query, kState: assistantPaneIsVisible.value ? 1 : undefined, kView: assistantViewId } });
    assistantOptionBarIsVisible.value = false;
}

function handleToggleAssistantPane(): void {
    if (viewportIsWide.value) {
        if (assistantPaneIsVisible.value && !studioPaneIsVisible.value) return; // Don't close the assistant pane if it's the only one visible.
        toggleAssistantPane();
        activeAppPaneId.value = assistantPaneIsVisible.value ? 'assistant' : 'studio';
        return;
    }

    // Display is narrow, pane already visible — toggle its option bar.
    if (assistantPaneIsVisible.value) {
        assistantOptionBarIsVisible.value = !assistantOptionBarIsVisible.value;
        return;
    }

    // Display is narrow, switching to this pane — close other option bar first if open.
    activeAppPaneId.value = 'assistant';
    studioOptionBarIsVisible.value = false;
    studioPaneIsVisible.value = false;
    toggleAssistantPane();
}

function toggleAssistantPane(): void {
    if ('kView' in route.query) {
        // Then - toggle assistant pane, ensure assistant pane is activated (may be first time), and update route properties.
        assistantPaneIsActive.value = assistantPaneIsVisible.value = !assistantPaneIsVisible.value;
        if (assistantPaneIsActive.value) assistantPaneActivated.value = true;
        router.replace({ query: { ...route.query, wbState: studioPaneIsVisible.value ? 1 : undefined, kState: assistantPaneIsVisible.value ? 1 : undefined } });
    } else {
        // Else - assistant pane has never been activated, active and navigate to last 'about' route.
        assistantPaneActivated.value = assistantPaneIsActive.value = assistantPaneIsVisible.value = true;
        router.replace({ query: { ...route.query, kView: 'about', wbState: studioPaneIsVisible.value ? 1 : undefined, kState: 1 } });
    }
}

// ── Event Handlers - Studio Option Bar ────────────────────────────────────────────────────────────────────────────

function handleStudioOptionBarHide(): void {
    if (viewportIsWide.value) return;
    assistantOptionBarIsVisible.value = false;
    studioOptionBarIsVisible.value = false;
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

    // Display is narrow, switching to this pane — close other option bar first if open.
    activeAppPaneId.value = 'studio';
    assistantOptionBarIsVisible.value = false;
    assistantPaneIsVisible.value = false;
    toggleStudioPane();
}

function toggleStudioPane(): void {
    if (route.path === '/') {
        // Then - studio pane has never been activated, active and navigate to last known route.
        studioPaneActivated.value = studioPaneIsActive.value = studioPaneIsVisible.value = true;
        router.replace({
            name: (Array.isArray(route.query.wbView) ? route.query.wbView[0] : route.query.wbView) ?? 'studio',
            query: { ...route.query, wbState: 1, kState: assistantPaneIsVisible.value ? 1 : undefined }
        });
    } else {
        // Else - toggle studio pane and update route properties.
        studioPaneIsActive.value = studioPaneIsVisible.value = !studioPaneIsVisible.value;
        router.replace({ query: { ...route.query, wbState: studioPaneIsVisible.value ? 1 : undefined, kState: assistantPaneIsVisible.value ? 1 : undefined } });
    }
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
    <div class="fixed inset-0 flex bg-surface pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-content" data-region="App">
        <!--
          z-10: Content: StudioPane (includes fixed StudioOptionBar), PaneSplitter & AssistantPane
          z-20: topFadeOut, assistantActionBar
          z-30: StudioOptionBar (floating)
          z-40: studioPaneToggle
          z-49: SessionButton
          z-50: LoadingMask (global — navigation and async component loads)
          z-51: SessionMenu
          z-60: DialogLayout/AuthDialog, DialogLayout/AccountDialog & DialogLayout/ConnectionDialogDialog
          z-70: ProgressBar
          -->

        <!-- Mask - Semi-transparent mask over the top safe area, so scrolling content fades out beneath it. -->
        <div class="fixed inset-x-0 top-0 z-20 h-[env(safe-area-inset-top)] bg-linear-to-t from-transparent via-surface/80 via-25% to-surface/95" data-region="topFadeOut" />

        <!-- Navigation progress bar. Always visible. -->
        <ProgressBar class="fixed inset-x-0 top-[env(safe-area-inset-top)] z-70" />

        <!-- Global loading mask - active during route changes and async loads; sustained as scrim when a dialog is open. -->
        <LoadingMask
            class="z-50"
            :is-dialog-active="dialogIsActive"
            :is-modal-active="modalIsActive"
            :navigation-is-active="navigationIsActive"
            :navigation-is-delayed="navigationIsDelayed"
        />

        <!-- Studio toggle fixed in top left corner. Always visible. -->
        <Button
            :aria-label="t(T, 'wb.toggle.label.aria')"
            class="fixed top-(--safe-top-offset) left-(--safe-left-offset) z-40 rounded-full!"
            :class="{ 'shadow-md': !viewportIsWide && contentScrollPosition > 0 }"
            data-region="studioPaneToggle"
            shape="icon"
            @click="handleToggleStudioPane"
        >
            <DPUseLogo />
        </Button>

        <!-- Assistant toggle fixed in top right corner. Always visible. -->
        <div class="fixed top-(--safe-top-offset) right-(--safe-right-offset) z-20 flex" data-region="assistantActionBar">
            <nav v-if="viewportIsWide || assistantOptionBarIsVisible" aria-label="Assistant options" data-region="assistantOptionBar">
                <Button :aria-label="t(T, 'k.select.about.aria')" shape="icon" @click="handleSelectAssistantPanel('about')">
                    <InfoIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>

                <Button :aria-label="t(T, 'k.select.library.aria')" shape="icon" @click="handleSelectAssistantPanel('library')">
                    <LibraryBigIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>

                <Button :aria-label="t(T, 'k.select.chat.aria')" shape="icon" @click="handleSelectAssistantPanel('chat')">
                    <MessageCircleMoreIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>
            </nav>

            <Button
                :aria-label="t(T, 'k.toggle.label.aria')"
                class="rounded-full! bg-surface"
                :class="{ 'shadow-md': !viewportIsWide && contentScrollPosition > 0 }"
                data-region="assistantPaneToggle"
                shape="icon"
                @click="handleToggleAssistantPane"
            >
                <AssistantLogo />
            </Button>
        </div>

        <!-- Session Button - Always visible. -->
        <SessionButton class="fixed bottom-(--safe-bottom-offset) left-(--safe-left-offset) z-49" :studio-option-bar-is-visible="studioOptionBarIsVisible" />

        <!-- Authentication Dialog - Activated using URL parameter 'dlg=auth'. -->
        <Transition name="action-fade">
            <AuthDialog v-if="authDialogIsVisible" class="z-60" />
        </Transition>

        <!-- Account Dialog - Activated using URL parameter 'dlg=account'. -->
        <Transition name="action-fade">
            <AccountDialog v-if="accountDialogIsVisible" class="z-60" />
        </Transition>

        <!-- Connection Dialog - Activated using URL parameter 'dlg=connection'. -->
        <Transition name="action-fade">
            <ConnectionDialog v-if="connectionDialogIsVisible" class="z-60" />
        </Transition>

        <!-- Studio Option Bar - Only rendered when viewport is narrow. -->
        <StudioOptionBar v-if="!viewportIsWide" class="z-30" :is-visible="studioOptionBarIsVisible" @continue="handleStudioOptionBarHide" />

        <!-- Studio Pane - Contains studio layout (via RouterView). Rendered once studio pane is activated and visible. -->
        <div
            v-if="studioPaneActivated"
            v-show="studioPaneIsVisible"
            class="grid h-full"
            :class="viewportIsWide ? 'grid-cols-[65px_1fr]' : 'grid-cols-1'"
            data-region="studioPane"
            :style="[studioPaneStyle, { 'container-type': 'inline-size' }]"
            @pointerdown="activeAppPaneId = 'studio'"
            @scroll.capture="activeAppPaneId = 'studio'"
        >
            <!-- Studio Option Bar - Only rendered when viewport is wide. -->
            <StudioOptionBar v-if="viewportIsWide" class="overflow-y-hidden" @continue="handleStudioOptionBarHide" />

            <!-- 'col-start-2' required to ensure content is place in 2nd grid column when async sidebar unresolved. Minimises CLS WebVital metric. -->
            <div class="min-h-0 min-w-0" :class="{ 'col-start-2': viewportIsWide }" data-region="studio-content">
                <RouterView v-slot="{ Component }">
                    <Transition name="action-fade" mode="out-in">
                        <component :is="Component" :key="$route.matched.find((r) => r.components?.default)?.path" />
                    </Transition>
                </RouterView>
            </div>
        </div>

        <!-- Pane (Vertical) Splitter - Rendered if viewport is wide and both panes are shown. -->
        <PaneSplitter v-if="paneSplitterIsVisible" v-model="paneSplitterPercent" />

        <!-- Assistant Pane - Contains assistant layout. Rendered once assistant pane is activated and visible. -->
        <div
            v-if="assistantPaneActivated"
            v-show="assistantPaneIsVisible"
            class="flex h-full"
            data-region="assistantPane"
            :style="assistantPaneStyle"
            @pointerdown="activeAppPaneId = 'assistant'"
            @scroll.capture="activeAppPaneId = 'assistant'"
        >
            <AssistantLayout class="flex-1" :studio-pane-is-hidden="!studioPaneIsVisible" />
        </div>
    </div>
</template>

<style scoped>
.action-fade-enter-active,
.action-fade-leave-active {
    transition: opacity 0.15s ease;
}
.action-fade-enter-from,
.action-fade-leave-to {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
    .action-fade-enter-active,
    .action-fade-leave-active {
        transition: none;
    }
}
</style>
