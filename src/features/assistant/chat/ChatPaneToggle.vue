<script setup lang="ts">
// Opens and closes the chat pane, the mirror of 'LibraryPaneToggle' at the other end of the split — same treatment, and
// for the same reason: a control that opens a pane should be recognisable as one wherever it appears.
//
// It lives outside the pane it toggles, or there would be no way back once the chat was shut.

// ── External Dependencies & Registrations
import { MessageSquareIcon } from '@lucide/vue';

// ── Static Components
import ToggleButton from '@/components/ui/action/ToggleButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Whether the chat is on screen, not merely open: on a narrow pane it can be open and still behind the library, and
// there this has to read as a way to bring it forward rather than as a way to close it.
const { isOpen } = defineProps<{ isOpen: boolean }>();
</script>

<template>
    <!-- Floats over the pane beneath, reserving no space, exactly as the app's own pane toggles do. 'z-20' clears the
         splitter's 'z-10'; both are sealed into the layout's '@container' stacking context.
         Clear of the app's fixed 'StudioPaneToggle' without arithmetic: that one sits in the header band above, and
         this row begins below the header and its separator. -->
    <ToggleButton :accessible-label="isOpen ? 'Close the chat' : 'Open the chat'" class="absolute top-2 left-3.5 z-20" data-region="ChatPaneToggle" :is-open="isOpen" size="sm">
        <MessageSquareIcon :stroke-width="1.5" />
    </ToggleButton>
</template>
