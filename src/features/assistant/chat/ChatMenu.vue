<script setup lang="ts">
// The chat's own drawer: the conversations the user can return to, and the actions that go with them. Opened by
// 'ChatPaneToggle' once the chat is already on screen, where a second press has nothing left to toggle.
//
// Built the way 'StudioOptionBar' builds its narrow-width panel — the same two-class slide, the same scrim dismissed by
// a click — with one difference that removes the breakpoint rather than answering it. That bar is a narrow-width
// stand-in for something otherwise always on screen, so it has to know how wide the viewport is; this is never on
// screen until it is asked for, so there is no width at which it behaves differently and nothing here reads one.
//
// It covers the chat pane and stops at its edge, as 'LibraryDocumentPanel' covers the library's: the pane beside it
// carries on. 'z-30' clears the toggle that opened this, so the scrim falls over it the way it falls over the thread.

// ── External Dependencies & Registrations
import { MessageSquarePlusIcon } from '@lucide/vue';
import { onUnmounted, watch } from 'vue';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import CloseButton from '@/components/ui/button/CloseButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface ChatSummaryConfig {
    id: string;
    title: string;
    snippet: string;
    timeLabel: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// TODO: Sample data only. Replace with the user's own conversations once the session service can list them; today
// 'useChatSession' holds the one live thread and knows nothing of any other.
const SAMPLE_CHATS: ChatSummaryConfig[] = [
    { id: 'c1', title: 'Quarterly revenue breakdown', snippet: 'Which regions moved most against last quarter?', timeLabel: 'Today' },
    { id: 'c2', title: 'Salesforce connector setup', snippet: 'Walk me through syncing opportunities.', timeLabel: 'Today' },
    { id: 'c3', title: 'Renewable energy targets', snippet: 'Summarise the policy targets by region.', timeLabel: 'Yesterday' },
    { id: 'c4', title: 'Support ticket trends', snippet: 'What drove the spike in August?', timeLabel: '3 Sep' },
    { id: 'c5', title: 'Onboarding a first data source', snippet: 'What is the shortest path to a data view?', timeLabel: '1 Sep' }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const menuIsOpen = defineModel<boolean>({ default: false });

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Escape is the one dialog behaviour a plain element does not get for free — this is not a '<dialog>', because a modal
// one is promoted to the browser's top layer over the whole viewport and this has to stay inside one pane.
// Bound only while open, so a closed drawer is not listening to every keystroke in the application.
watch(menuIsOpen, (newMenuIsOpen) => {
    if (newMenuIsOpen) document.addEventListener('keydown', handleDocumentKeydown);
    else document.removeEventListener('keydown', handleDocumentKeydown);
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleDocumentKeydown);
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') menuIsOpen.value = false;
}

// TODO: Open the chat this names. Nothing is switched yet — there is one session, so there is nothing to switch to.
function handleSelectChat(): void {
    menuIsOpen.value = false;
}

// TODO: Start a new conversation. Placed now so the drawer's layout is settled; what it does is not built yet.
function handleStartChat(): void {
    menuIsOpen.value = false;
}
</script>

<template>
    <Transition appear name="horizontal-slide-ltr">
        <!-- 'overflow-hidden' is what keeps the slide inside the pane. The panel enters from 'translateX(-100%)', which
             puts it a full width left of here, and an absolutely positioned box does not clip its children — so without
             this it spends the whole animation painted over the studio pane next door before arriving. Nothing above
             clips it either: the layout's '@container' applies layout containment, not paint. -->
        <div v-if="menuIsOpen" class="absolute inset-0 z-30 overflow-hidden" data-region="ChatMenu">
            <!-- The dialog scrim, and the same token a real one paints: 'DialogShell' sets its '::backdrop' to
                 'var(--overlay)', which is what 'bg-overlay' resolves to here. Dismissing on a click is the whole of
                 its job, so it takes the keyboard out of its own reach and leaves Escape to the handler above. -->
            <div aria-label="Close the chat menu" class="absolute inset-0 bg-overlay" role="button" tabindex="-1" @click="menuIsOpen = false" @keydown="menuIsOpen = false" />

            <!-- 'mr-auto' rather than a float or a grid: the width is capped, so the free space becomes the right
                 margin and the panel comes to rest against the pane's left edge — which is the edge it slid in from. -->
            <div
                aria-label="Chats"
                class="dpuse-horizontal-slide-ltr-element relative mr-auto flex size-full max-w-75 flex-col border-r border-separator bg-surface shadow-md"
                role="dialog"
            >
                <header class="flex flex-none items-center justify-between border-b border-separator py-2 pr-2 pl-4">
                    <h2 class="truncate text-sm font-medium text-emphasis">Chats</h2>
                    <CloseButton aria-label="Close the chat menu" @click="menuIsOpen = false" />
                </header>

                <!-- The drawer's one action, above the list it acts on. -->
                <div class="flex-none border-b border-separator p-2">
                    <Button class="flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-left text-sm" shape="minimal" @click="handleStartChat">
                        <MessageSquarePlusIcon class="size-4 flex-none" :stroke-width="1.5" />
                        <span class="truncate">New chat</span>
                    </Button>
                </div>

                <ScrollArea class="flex min-h-0 flex-1 flex-col p-2">
                    <Button
                        v-for="chat in SAMPLE_CHATS"
                        :key="chat.id"
                        class="mt-0.5 flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left first:mt-0"
                        shape="minimal"
                        @click="handleSelectChat"
                    >
                        <div class="w-full truncate text-sm font-medium">{{ chat.title }}</div>
                        <div class="w-full truncate text-xs text-muted">{{ chat.snippet }}</div>
                        <div class="mt-0.5 text-xs text-subtle">{{ chat.timeLabel }}</div>
                    </Button>
                </ScrollArea>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
/*
 * Vue Transition - Horizontal slide left to right. Copied in shape from 'StudioOptionBar', which is the other drawer
 * that enters this way: outer selector fades the wrapper (opacity), inner .dpuse-horizontal-slide-ltr-element slides
 * the content (transform). Decoupling the two allows independent timing without compositing issues.
 */
.horizontal-slide-ltr-enter-active,
.horizontal-slide-ltr-leave-active {
    transition: opacity 220ms ease-in-out;
}
.horizontal-slide-ltr-enter-from,
.horizontal-slide-ltr-leave-to {
    opacity: 0;
}
.horizontal-slide-ltr-enter-active .dpuse-horizontal-slide-ltr-element,
.horizontal-slide-ltr-leave-active .dpuse-horizontal-slide-ltr-element {
    transition: transform 260ms ease-in-out;
}
.horizontal-slide-ltr-enter-from .dpuse-horizontal-slide-ltr-element,
.horizontal-slide-ltr-leave-to .dpuse-horizontal-slide-ltr-element {
    transform: translateX(-100%);
}
@media (prefers-reduced-motion: reduce) {
    .horizontal-slide-ltr-enter-active,
    .horizontal-slide-ltr-leave-active {
        transition: none;
    }
    .horizontal-slide-ltr-enter-active .dpuse-horizontal-slide-ltr-element,
    .horizontal-slide-ltr-leave-active .dpuse-horizontal-slide-ltr-element {
        transition: none;
    }
}
</style>
