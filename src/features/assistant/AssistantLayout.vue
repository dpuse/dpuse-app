<script setup lang="ts">
// The assistant pane's own split: chat on the left, the library on the right, divided by the same splitter the app
// uses between the studio and assistant panes. A split inside a split, which is why nothing here reads the viewport —
// this pane's width changes whenever the app-level splitter moves, and no media query ever reports that.

// ── External Dependencies & Registrations
import { computed, useTemplateRef, watch } from 'vue';
import { useElementSize, useLocalStorage } from '@vueuse/core';

// ── Local Framework
import { defineLazyComponent } from '@/utilities/index.ts';
import { t } from '@/state/locale';
import { TEXT } from './AssistantLayout_.json';
import { useAssistantLibrary } from '@/features/assistant/_assistantLibrary';
import { useSplitPanes } from '@/composables/useSplitPanes';
import { ASSISTANT_MODEL_CONFIGS, type AssistantModelConfig } from './chat/modelConfigs';
import { loadChatPanel, loadLibraryPanel } from './assistantLoaders';

// ── Static Components
import AssistantHeader from './_components/AssistantHeader.vue';
import AssistantToolbar from './_components/AssistantToolbar.vue';
import PaneSplitter from '@/components/ui/PaneSplitter.vue';
import Separator from '@/components/ui/Separator.vue';

// ── Dynamic Components
const ChatPanel = defineLazyComponent(loadChatPanel, 'ChatPanel');
const LibraryPanel = defineLazyComponent(loadLibraryPanel, 'LibraryPanel');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const MODEL_ID_KEY = 'dpuse-assistantModelId';

const SPLITTER_DEFAULT_PERCENT = 55; // Chat is the pane the user acts in, so it starts with the larger share.
const SPLITTER_PERCENT_KEY = 'dpuse-assistantPaneSplitterPercent';

// Below this the pane cannot hold two readable columns, so it shows one at a time. Deliberately not Tailwind's 'md'
// (48rem) that 'viewportIsWide' uses: this is a pane inside a pane, and two columns of chat and library need less than
// a whole application does.
const WIDE_PANE_THRESHOLD_PX = 640;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { studioPaneIsHidden } = defineProps<{ studioPaneIsHidden: boolean }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const layoutElement = useTemplateRef<HTMLElement>('layoutElement');
const modelId = useLocalStorage(MODEL_ID_KEY, ASSISTANT_MODEL_CONFIGS[0].id); // An id no longer offered falls back in 'selectedModelConfig'.
const splitterPercent = useLocalStorage(SPLITTER_PERCENT_KEY, SPLITTER_DEFAULT_PERCENT, {
    serializer: { read: (value) => Number(value) || SPLITTER_DEFAULT_PERCENT, write: String }
});

const { paneIsOpen: libraryIsOpen, searchHasQuery } = useAssistantLibrary();
const { width: layoutWidth } = useElementSize(layoutElement);
const paneIsWide = computed(() => layoutWidth.value >= WIDE_PANE_THRESHOLD_PX);
const { currentPaneId, isPaneOpen, isPaneVisible, wasPaneOpened, splitterIsVisible, setPaneOpenState } = useSplitPanes(['chat', 'library'] as const, {
    containerIsWide: paneIsWide,
    initialPaneId: 'chat'
});

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// The selected model — only meaningful while viewing Chat.
const selectedModelConfig = computed<AssistantModelConfig>(() => ASSISTANT_MODEL_CONFIGS.find((config) => config.id === modelId.value) ?? ASSISTANT_MODEL_CONFIGS[0]);

const chatPaneStyle = computed(() => {
    if (!isPaneVisible('chat')) return { width: '0' };
    // Half the splitter comes off each pane, so an even split leaves the two the same width.
    return isPaneVisible('library') ? { minWidth: '0', width: `calc(${String(splitterPercent.value)}% - var(--pane-splitter-width) / 2)` } : { minWidth: '0', flex: '1' };
});

const libraryPaneStyle = computed(() => {
    return isPaneVisible('library') ? { minWidth: '0', flex: '1' } : { width: '0' };
});

// ── Initialisation ───────────────────────────────────────────────────────────────────────────────────────────────────

// Chat is always open; the library joins it only once asked for. The toggle is the request, and a link that arrives
// with the library open, or with a search already in it, carries the same request — which is what reopens it on a
// reload or a shared link.
setPaneOpenState('chat', true);
if (libraryIsOpen.value || searchHasQuery.value) setPaneOpenState('library', true);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// One direction only: the pane model is the truth while the app runs, and the URL is where it is written down so a
// reload can restore it. Reading it back here would fight the toggle.
watch(
    () => isPaneOpen('library'),
    (newLibraryIsOpen) => {
        libraryIsOpen.value = newLibraryIsOpen;
    }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleModelChange(newModelConfig: AssistantModelConfig): void {
    modelId.value = newModelConfig.id;
}

// A pointer, a scroll, or focus arriving anywhere in a pane makes it the one the user is working in — the same three
// signals 'App.vue' uses, and for the same reason: none of them covers the others.
function handleClaimPane(paneId: 'chat' | 'library'): void {
    currentPaneId.value = paneId;
}

// Keyed to what is on screen rather than to what is merely open. On a narrow pane a pane can be open and still behind
// the other, and there the toggle has to bring it forward — closing something the user cannot see would read as the
// button doing nothing. Opening brings it to the front, which 'setPaneOpenState' settles.
//
// The last visible pane will not close, the guard 'App.vue' puts on its own two toggles: an assistant showing neither
// chat nor library is an empty pane the user has no way out of, since both toggles live inside it.
function handleTogglePane(paneId: 'chat' | 'library'): void {
    const otherPaneId = paneId === 'chat' ? 'library' : 'chat';
    if (isPaneVisible(paneId) && !isPaneVisible(otherPaneId)) return;

    setPaneOpenState(paneId, !isPaneVisible(paneId));
}
</script>

<template>
    <div ref="layoutElement" class="@container relative flex h-full min-w-0 flex-col" data-region="AssistantLayout">
        <!-- '@container' is what the panes below measure themselves against, and it earns its place twice: layout
             containment also makes this a stacking context, so the splitter's 'z-10' and the search bar's 'z-20' are
             sealed in here rather than competing with the app-level ladder in 'App.vue'. -->

        <AssistantHeader class="mx-page flex-none" :title="t(TEXT, 'assistant.title')" :toolbar-placement="paneIsWide ? 'end' : 'title'">
            <template #toolbar>
                <AssistantToolbar :chat-is-visible="isPaneVisible('chat')" :is-switch="!paneIsWide" :library-is-visible="isPaneVisible('library')" @toggle="handleTogglePane" />
            </template>
        </AssistantHeader>

        <Separator />

        <!-- The row the splitter measures itself against, and the containing block the search bar floats over. -->
        <div class="relative flex min-h-0 flex-1">
            <div
                v-show="isPaneVisible('chat')"
                class="flex min-h-0"
                data-region="AssistantChatPane"
                :style="chatPaneStyle"
                @focusin="handleClaimPane('chat')"
                @pointerdown="handleClaimPane('chat')"
                @scroll.capture="handleClaimPane('chat')"
            >
                <ChatPanel
                    :model-config="selectedModelConfig"
                    :model-configs="ASSISTANT_MODEL_CONFIGS"
                    :studio-pane-is-hidden="studioPaneIsHidden"
                    @model-change="handleModelChange"
                />
            </div>

            <PaneSplitter v-if="splitterIsVisible" v-model="splitterPercent" />

            <!-- Mounted on first use and kept, so a closed library does not lose the folder it was left on. -->
            <div
                v-if="wasPaneOpened('library')"
                v-show="isPaneVisible('library')"
                class="flex min-h-0"
                data-region="AssistantLibraryPane"
                :style="libraryPaneStyle"
                @focusin="handleClaimPane('library')"
                @pointerdown="handleClaimPane('library')"
                @scroll.capture="handleClaimPane('library')"
            >
                <LibraryPanel />
            </div>
        </div>
    </div>
</template>
