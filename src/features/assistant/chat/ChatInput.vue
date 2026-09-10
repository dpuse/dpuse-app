<script setup lang="ts">
// The chat's composer: the draft, the model it will be sent to, and the two actions that go with it.
//
// Built as a pair with 'LibrarySearchInput' in the other pane — a bordered surface with the text box above and a tinted
// bar of controls below it — so the assistant's two panes read as one design.
//
// It floats over the thread, which scrolls up behind it, and reports its own height so the scroller beneath can reserve
// the space it covers.

// ── External Dependencies & Registrations
import { ArrowUpIcon, PlusIcon, SquareIcon } from '@lucide/vue';
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue';

// ── Local Framework
import type { AssistantModelConfig } from './modelConfigs';

// ── Static Components
import AssistantModelMenu from '../_components/AssistantModelMenu.vue';
import IconButton from '@/components/ui/action/IconButton.vue';
import ChatMenu from './ChatMenu.vue';
import TextArea from '@/components/ui/text/TextArea.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// 'mb-8.75' below, which sits outside the height measured here. Added to what is reported rather than left for the
// caller to add back, so the class and the number that mirrors it stay in one file.
const BOTTOM_INSET_PX = 35;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const draft = defineModel<string>({ default: '' });

const {
    modelConfig,
    modelConfigs,
    responseIsRunning,
    // Whether the assistant reaches the left edge of the screen, which is the only case where the session button
    // overlaps this control.
    studioPaneIsHidden
} = defineProps<{ modelConfig: AssistantModelConfig; modelConfigs: AssistantModelConfig[]; responseIsRunning: boolean; studioPaneIsHidden?: boolean }>();

// Sending is the caller's to do — it owns the session — so this reports the request rather than acting on it.
const emit = defineEmits<{ heightChange: [height: number]; modelChange: [modelConfig: AssistantModelConfig]; send: []; stop: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const inputElement = useTemplateRef<HTMLElement>('inputElement');

const state: { resizeObserver: ResizeObserver | null } = { resizeObserver: null };

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// The send button is the one filled control in the bar — see the comment above it — so it carries its own colour
// rather than reading it from 'IconButton', which now has a single, unfilled look. '!' forces each utility over that
// look's own background/hover/active classes, the same way 'IconButton' already does for its active state.
const sendButtonClasses = computed(() =>
    responseIsRunning
        ? 'bg-danger! hover:bg-danger-hover! active:bg-danger-active! text-danger-text!'
        : 'bg-info! hover:bg-info-hover! active:bg-info-active! text-info-text!'
);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Measured rather than stated: this grows with the text typed into it, so no constant could stand in for its height.
onMounted(() => {
    if (!inputElement.value) return;
    reportHeight();
    state.resizeObserver = new ResizeObserver(reportHeight);
    state.resizeObserver.observe(inputElement.value);
});

onUnmounted(() => {
    state.resizeObserver?.disconnect();
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// The one composer action: the same button sends while the thread is idle and cancels while a response is running.
function handleAction(): void {
    if (responseIsRunning) {
        emit('stop');
        return;
    }
    emit('send');
}

// TODO: Start a new conversation. The control is placed now so the composer's layout is settled; what it does is not
// built yet — 'useChatSession' holds one thread and cannot yet be asked for another.
function handleStartChat(): void {
    // Intentionally empty until a new chat is something the session service can be asked for.
}

function handleSelectModel(newModelConfig: AssistantModelConfig): void {
    emit('modelChange', newModelConfig);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function reportHeight(): void {
    emit('heightChange', (inputElement.value?.offsetHeight ?? 0) + BOTTOM_INSET_PX);
}
</script>

<template>
    <div
        ref="inputElement"
        :class="[
            'absolute bottom-0 mb-9.75 flex flex-none flex-col bg-surface shadow-md',
            'rounded-lg border border-selected-border',
            // Two separate questions, and one breakpoint used to answer both — which is what made this wrong once.
            //
            // Where the composer may start is about the session button, which is fixed to the viewport's bottom-left
            // corner and so reaches this pane only when the assistant runs to the left edge of the screen. That is true
            // at every width, so it is a bound rather than a breakpoint: nothing below may reset it, which is why the
            // centring keeps the insets instead of overriding them with 'inset-x-0'.
            studioPaneIsHidden ? 'right-4 left-16' : 'inset-x-4',
            // How wide it then gets is about the room the pane has, which is a container query. Capping with 'max-w'
            // rather than setting a width leaves the element free to fill the inset box when it is narrow, and the auto
            // margins centre it within that box once the cap bites.
            '@md:mx-auto @md:max-w-[65ch]'
        ]"
        data-region="ChatInput"
    >
        <TextArea v-model="draft" class="max-h-40 rounded-t-lg" placeholder="Ask a question" @keydown.enter.exact.prevent="emit('send')" />

        <!-- Grid rather than flex: the conversation controls and the send button sit in max-content tracks they never give up or
             stretch into, while the model menu between them takes the rest and ellipsises once the bar genuinely runs short. That
             makes the model label the one thing that gives way as the pane narrows, which is right — it is the only part of the bar
             that degrades to something still readable. -->
        <div
            class="grid grid-cols-[max-content_max-content_minmax(0,auto)_max-content] items-center gap-x-2 rounded-b-lg border-t border-selected-border bg-selected px-2 py-1.5 text-selected-text"
        >
            <!-- The two conversation controls sit together at the left end: one starts a thread, the other returns to one. Shaped
                 like the send button at the other end of the row, so the bar reads as one set of actions. Neutral rather than
                 tinted: sending is the thing this bar is for, and competing filled circles would put them on equal footing. -->
            <IconButton accessible-label="Start a new chat" rounded size="sm" @click="handleStartChat">
                <PlusIcon class="size-4!" stroke-width="2.5" />
            </IconButton>

            <ChatMenu />

            <AssistantModelMenu class="min-w-0 justify-self-start" :model-config="modelConfig" :model-configs="modelConfigs" @select="handleSelectModel" />

            <IconButton
                :accessible-label="responseIsRunning ? 'Stop the response' : 'Send the message'"
                :class="sendButtonClasses"
                :disabled="!responseIsRunning && draft.trim().length === 0"
                rounded
                size="sm"
                @click="handleAction"
            >
                <!-- Filled: an outlined square at this size reads as an empty box rather than a stop. -->
                <SquareIcon v-if="responseIsRunning" class="size-3!" fill="currentColor" stroke-width="2.5" />
                <ArrowUpIcon v-else class="size-5!" stroke-width="2.5" />
            </IconButton>
        </div>
    </div>
</template>
