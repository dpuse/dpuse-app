<script setup lang="ts">
// Opens and closes the chat pane, the mirror of 'LibraryPaneToggle' at the other end of the split — same treatment, and
// for the same reason: a control that opens a pane should be recognisable as one wherever it appears.
//
// It lives outside the pane it toggles, or there would be no way back once the chat was shut.

// ── External Dependencies & Registrations
import { MessageSquareIcon } from '@lucide/vue';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import ChatIcon from '~/src/components/icons/ChatIcon.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Whether the chat is on screen, not merely open: on a narrow pane it can be open and still behind the library, and
// there this has to read as a way to bring it forward rather than as a way to close it.
//
// 'menuIsOpen' is only meaningful while it is: once the chat is up this button stops being a way to collapse the pane
// and becomes the trigger for the chat's drawer, so that is what its expanded state has to describe.
const { isOpen, menuIsOpen } = defineProps<{ isOpen: boolean; menuIsOpen?: boolean }>();
</script>

<template>
    <!-- Floats over the pane beneath, reserving no space, exactly as the app's own pane toggles do. 'z-20' clears the
         splitter's 'z-10'; both are sealed into the layout's '@container' stacking context.
         Clear of the app's fixed 'StudioPaneToggle' without arithmetic: that one sits in the header band above, and
         this row begins below the header and its separator. -->
    <Button
        :aria-expanded="isOpen ? menuIsOpen === true : false"
        :aria-haspopup="isOpen ? 'dialog' : undefined"
        :aria-label="isOpen ? 'Show chats and options' : 'Open the chat'"
        class="absolute top-2 left-3.5 z-20 rounded-full! border border-separator bg-surface shadow-md"
        data-region="ChatPaneToggle"
        :is-active="isOpen"
        shape="icon"
        size="sm"
    >
        <!-- The open chat shows its own icon, lines and all; closed falls back to the empty square. -->
        <ChatIcon v-if="isOpen" :stroke-width="1.5" />
        <MessageSquareIcon v-else :stroke-width="1.5" />
    </Button>
</template>
