<script setup lang="ts">
// Opens and closes the library pane, in the way 'StudioPaneToggle' and 'AssistantPaneToggle' govern the app's own
// panes — and given the same treatment, a round button on a surface pinned to a corner, so a control that opens a pane
// is recognisable as one.
//
// It has to live outside the pane it toggles, or there would be no way back once the library was shut. That is why the
// search box it reveals sits inside the library while this does not.

// ── External Dependencies & Registrations
import { LibraryIcon } from '@lucide/vue';

// ── Static Components
import ToggleButton from '@/components/ui/action/ToggleButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Whether the library is on screen, not merely open: on a narrow pane it can be open and still behind the chat, and
// there this has to read as a way to bring it forward rather than as a way to close it.
const { isOpen } = defineProps<{ isOpen: boolean }>();
</script>

<template>
    <!-- Floats over whichever pane is beneath, reserving no space, exactly as the app's own pane toggles do. 'z-20'
         clears the splitter's 'z-10'; both are sealed into the layout's '@container' stacking context. -->
    <ToggleButton
        :accessible-label="isOpen ? 'Close the library' : 'Search the library'"
        class="absolute top-2 right-3.5 z-20"
        data-region="LibraryPaneToggle"
        :is-open="isOpen"
        size="sm"
    >
        <LibraryIcon :stroke-width="1.5" />
    </ToggleButton>
</template>
