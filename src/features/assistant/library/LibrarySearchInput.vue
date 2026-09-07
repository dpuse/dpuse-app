<script setup lang="ts">
// The library's search field. It filters the index as the query is typed, and the query is the only thing that decides
// whether the pane is listing folders or results — there is no mode for it to fall out of step with.
//
// It sits at the top of the index rather than floating over it, so it scrolls away with the page it belongs to and the
// pane's own toggles keep the band above it to themselves. Where it appears at all is the index's decision, not this
// file's: 'LibraryPanel' drops it once a folder is open, and the trail there is the way back to it.
//
// Built as a pair with 'ChatInput' in the other pane — the same bordered surface around the same text box — so the
// assistant's two panes read as one design. It carries no shadow, which is the one deliberate difference: the composer
// floats over its thread and needs to lift off it, and this does not.

// ── External Dependencies & Registrations
// ── Local Framework
import { useAssistantLibrary } from '@/state/assistantLibrary';

// ── Static Components
import TextArea from '@/components/ui/text/TextArea.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { query } = useAssistantLibrary();
</script>

<template>
    <div class="flex flex-col rounded-lg border border-selected-border bg-surface focus-within:ring-1 focus-within:ring-selected-ring" data-region="LibrarySearchInput">
        <!-- Wrapped because 'TextArea' forwards its attributes to the text box rather than to its own root, so a class
             put on it would size the box and leave the root unable to shrink. -->
        <div class="min-w-0">
            <!-- 'TextArea' rather than 'TextInput': it carries no border, background or rounding of its own, so the box
                 around it provides the frame exactly as it does for the chat composer, and its built-in clear button is
                 the same one the composer shows.
                 Held to a single line by 'wrap', not by a height: the box sizes itself to its content, so text that
                 cannot wrap measures one line however long it gets and runs sideways instead of growing. A fixed height
                 would have fought that sizing rather than removed the reason for it. Enter is stopped for the same
                 reason there is no submit — results follow the query as it is typed. -->
            <TextArea
                v-model="query"
                class="rounded-lg"
                label="Search the library"
                label-hidden
                placeholder="Search articles by keyword, topic…"
                rows="1"
                wrap="off"
                @keydown.enter.prevent
            />
        </div>
    </div>
</template>
