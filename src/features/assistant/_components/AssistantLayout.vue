<script setup lang="ts">
// The assistant pane's own split: chat on the left, the library on the right, divided by the same splitter the app
// uses between the studio and assistant panes. A split inside a split, which is why nothing here reads the viewport —
// this pane's width changes whenever the app-level splitter moves, and no media query ever reports that.

// ── External Dependencies & Registrations
import { computed, ref, useTemplateRef, watch } from 'vue';

// ── Local Framework
import { defineAsyncPanel } from '@/utilities/index.ts';
import { useAssistantLibrary } from '@/state/assistantLibrary';
import { useElementIsWide } from '@/composables/useElementIsWide';
import { useSplitPanes } from '@/composables/useSplitPanes';
import { ASSISTANT_MODEL_CONFIGS, type AssistantModelConfig } from '../chat/modelConfigs';

// ── Static Components
import AssistantHeader from './AssistantHeader.vue';
import ChatPaneToggle from '../chat/ChatPaneToggle.vue';
import LibraryPaneToggle from '../library/LibraryPaneToggle.vue';
import PaneSplitter from '@/components/ui/PaneSplitter.vue';
import Separator from '@/components/ui/Separator.vue';

// ── Dynamic Components
const ChatPanel = defineAsyncPanel(() => import('../chat/ChatPanel.vue'), 'ChatPanel');
const LibraryPanel = defineAsyncPanel(() => import('../library/LibraryPanel.vue'), 'LibraryPanel');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const MODEL_ID_KEY = 'dpuse-assistantModelId';

const SPLITTER_DEFAULT_PERCENT = 55; // Chat is the pane the user acts in, so it starts with the larger share.
const SPLITTER_PERCENT_KEY = 'dpuse-assistantPaneSplitterPercent';

// Below this the pane cannot hold two readable columns, so it shows one at a time. Deliberately not Tailwind's 'md'
// (768px) that 'viewportIsWide' uses: this is a pane inside a pane, and two columns of chat and library need less than
// a whole application does.
const WIDE_PANE_THRESHOLD_PX = 640;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { studioPaneIsHidden } = defineProps<{ studioPaneIsHidden: boolean }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const layoutElement = useTemplateRef<HTMLElement>('layoutElement');
const modelId = ref(establishModelId());
const splitterPercent = ref(establishSplitterPercent());

const { paneIsOpen: libraryIsOpen, searchIsActive } = useAssistantLibrary();
const { isWide: paneIsWide } = useElementIsWide(layoutElement, WIDE_PANE_THRESHOLD_PX);
const { activePaneId, isPaneActive, isPaneVisible, wasPaneActivated, splitterIsVisible, setPaneActiveState } = useSplitPanes(['chat', 'library'] as const, {
    containerIsWide: paneIsWide,
    initialPaneId: 'chat'
});

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// The selected model — only meaningful while viewing Chat.
const activeModelConfig = computed<AssistantModelConfig>(() => ASSISTANT_MODEL_CONFIGS.find((config) => config.id === modelId.value) ?? ASSISTANT_MODEL_CONFIGS[0]);

const chatPaneStyle = computed(() => {
    if (!isPaneVisible('chat')) return { width: '0' };
    // Half the splitter comes off each pane, so an even split leaves the two the same width.
    if (isPaneVisible('library')) return { minWidth: '0', width: `calc(${String(splitterPercent.value)}% - var(--pane-splitter-width) / 2)` };
    return { minWidth: '0', flex: '1' };
});

const libraryPaneStyle = computed(() => {
    if (!isPaneVisible('library')) return { width: '0' };
    return { minWidth: '0', flex: '1' };
});

// ── Initialisation ───────────────────────────────────────────────────────────────────────────────────────────────────

// Chat is always open; the library joins it only once asked for. The toggle is the request, and a link that arrives
// with the library open, or with a search already in it, carries the same request — which is what reopens it on a
// reload or a shared link.
setPaneActiveState('chat', true);
if (libraryIsOpen.value || searchIsActive.value) setPaneActiveState('library', true);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(modelId, (newModelId) => {
    localStorage.setItem(MODEL_ID_KEY, newModelId);
});

// One direction only: the pane model is the truth while the app runs, and the URL is where it is written down so a
// reload can restore it. Reading it back here would fight the toggle.
watch(
    () => isPaneActive('library'),
    (newLibraryIsActive) => {
        libraryIsOpen.value = newLibraryIsActive;
    }
);

watch(splitterPercent, (newSplitterPercent) => {
    try {
        localStorage.setItem(SPLITTER_PERCENT_KEY, String(newSplitterPercent));
    } catch {
        // Storage can refuse a write — Safari in private browsing, or a full quota. The split still works for this
        // document, it just will not be remembered, and a throw here would escape the watcher and be raised as an
        // app-level failure. Losing a preference is not worth a modal.
    }
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleModelChange(newModelConfig: AssistantModelConfig): void {
    modelId.value = newModelConfig.id;
}

// A pointer, a scroll, or focus arriving anywhere in a pane makes it the one the user is working in — the same three
// signals 'App.vue' uses, and for the same reason: none of them covers the others.
function handlePaneActivate(paneId: 'chat' | 'library'): void {
    activePaneId.value = paneId;
}

function handleToggleChat(): void {
    togglePane('chat');
}

function handleToggleLibrary(): void {
    togglePane('library');
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function establishModelId(): string {
    try {
        const storedId = localStorage.getItem(MODEL_ID_KEY);
        if (storedId != null && ASSISTANT_MODEL_CONFIGS.some((config) => config.id === storedId)) return storedId;
    } catch {
        // Ignore - fall back to the default model.
    }
    return ASSISTANT_MODEL_CONFIGS[0].id;
}

function establishSplitterPercent(): number {
    try {
        return Number(localStorage.getItem(SPLITTER_PERCENT_KEY)) || SPLITTER_DEFAULT_PERCENT;
    } catch {
        return SPLITTER_DEFAULT_PERCENT;
    }
}

// Keyed to what is on screen rather than to what is merely open. On a narrow pane a pane can be active and still behind
// the other, and there the toggle has to bring it forward — closing something the user cannot see would read as the
// button doing nothing. Opening brings it to the front, which 'setPaneActiveState' settles.
//
// The last visible pane will not close, the guard 'App.vue' puts on its own two toggles: an assistant showing neither
// chat nor library is an empty pane the user has no way out of, since both toggles live inside it.
function togglePane(paneId: 'chat' | 'library'): void {
    const otherPaneId = paneId === 'chat' ? 'library' : 'chat';
    if (isPaneVisible(paneId) && !isPaneVisible(otherPaneId)) return;

    setPaneActiveState(paneId, !isPaneVisible(paneId));
}
</script>

<template>
    <div ref="layoutElement" class="@container relative flex h-full min-w-0 flex-col" data-region="AssistantLayout">
        <!-- '@container' is what the panes below measure themselves against, and it earns its place twice: layout
             containment also makes this a stacking context, so the splitter's 'z-10' and the search bar's 'z-20' are
             sealed in here rather than competing with the app-level ladder in 'App.vue'. -->

        <AssistantHeader class="mx-4 flex-none" :title="'Assistant'" />

        <Separator />

        <!-- The row the splitter measures itself against, and the containing block the search bar floats over. -->
        <div class="relative flex min-h-0 flex-1">
            <!-- Outside the panes because each has to outlive the one it opens. The search box the library toggle
                 reveals is inside the library, where it belongs. -->
            <ChatPaneToggle :is-open="isPaneVisible('chat')" @click="handleToggleChat" />

            <LibraryPaneToggle :is-open="isPaneVisible('library')" @click="handleToggleLibrary" />

            <div
                v-show="isPaneVisible('chat')"
                class="flex min-h-0"
                data-region="AssistantChatPane"
                :style="chatPaneStyle"
                @focusin="handlePaneActivate('chat')"
                @pointerdown="handlePaneActivate('chat')"
                @scroll.capture="handlePaneActivate('chat')"
            >
                <ChatPanel
                    :model-config="activeModelConfig"
                    :model-configs="ASSISTANT_MODEL_CONFIGS"
                    :studio-pane-is-hidden="studioPaneIsHidden"
                    @model-change="handleModelChange"
                />
            </div>

            <PaneSplitter v-if="splitterIsVisible" v-model="splitterPercent" />

            <!-- Mounted on first use and kept, so a closed library does not lose the folder it was left on. -->
            <div
                v-if="wasPaneActivated('library')"
                v-show="isPaneVisible('library')"
                class="flex min-h-0"
                data-region="AssistantLibraryPane"
                :style="libraryPaneStyle"
                @focusin="handlePaneActivate('library')"
                @pointerdown="handlePaneActivate('library')"
                @scroll.capture="handlePaneActivate('library')"
            >
                <LibraryPanel />
            </div>
        </div>
    </div>
</template>
