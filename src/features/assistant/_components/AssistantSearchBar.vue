<script setup lang="ts">
// The library's search box. It sits in the flow at the top of the library pane rather than floating over both panes:
// searching is the library's alone, so it belongs to the pane it acts on and takes its space there like any other
// content. The button that reveals it is 'LibraryPaneToggle', which has to live outside the pane to survive it closing.

// ── Local Framework
import { useAssistantLibrary } from '@/state/assistantLibrary';

// ── Static Components
import TextArea from '@/components/ui/text/TextArea.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { query } = useAssistantLibrary();
</script>

<template>
    <div
        class="flex items-center rounded-lg border border-selected-border bg-surface pl-2.5 shadow-md focus-within:ring-1 focus-within:ring-selected-ring"
        data-region="AssistantSearchBar"
    >
        <!-- Wrapped because 'TextArea' forwards its attributes to the text box rather than to its own root, so a class
             put on it would size the box and leave the root as an unshrinkable flex item. -->
        <div class="min-w-0 flex-1">
            <!-- 'TextArea' rather than 'TextInput': it carries no border, background or rounding of its own, so the box
                 around it provides the frame exactly as it does for the chat composer, and its built-in clear button is
                 the same one the composer shows.
                 Held to a single line by 'wrap', not by a height: the box sizes itself to its content, so text that
                 cannot wrap measures one line however long it gets and runs sideways instead of growing. A fixed height
                 would have fought that sizing rather than removed the reason for it. Enter is stopped for the same
                 reason there is no submit — results follow the query as it is typed. -->
            <TextArea
                v-model="query"
                label="Search the library"
                label-hidden
                placeholder="Search connectors, data views, context and documents…"
                rows="1"
                wrap="off"
                @keydown.enter.prevent
            />
        </div>
    </div>
</template>
