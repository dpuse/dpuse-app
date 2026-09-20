<script setup lang="ts">
// ── External Dependencies & Registrations
import { useTemplateRef } from 'vue';
import { SearchIcon, XIcon } from '@lucide/vue';

import { t } from '@/state/locale';
import { TEXT } from './LibrarySearchInput_.json';

// ── Local Framework
import { useAssistantLibrary } from '@/state/assistantLibrary';

// ── Static Components
import IconButton from '@/components/ui/action/IconButton.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { query } = useAssistantLibrary();

const inputElement = useTemplateRef<HTMLInputElement>('inputElement');

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Focus returns to the field rather than being dropped on the button that has just disappeared.
function handleClear(): void {
    query.value = '';
    inputElement.value?.focus();
}
</script>

<template>
    <div class="relative m-0.5" data-region="LibrarySearchInput">
        <!-- Leading, and decorative: the magnifier says what the field is, which the field's own label already says to
             anyone not reading the screen. An icon at the other end would read as a submit, and there is nothing to
             submit — results follow the query as it is typed. -->
        <SearchIcon aria-hidden="true" class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-subtle" :stroke-width="1.5" />

        <!-- An 'input' rather than a textarea: one line of value, announced as one. Enter needs no handler because
             there is no form here to submit to, and 'enterkeyhint' labels the key on a soft keyboard accordingly.
             The webkit pseudo-element is the clear control 'type="search"' brings with it, suppressed so it does not
             sit beside the button below rather than instead of it. -->
        <input
            ref="inputElement"
            v-model="query"
            :aria-label="t(TEXT, 'search.aria')"
            class="w-full rounded-lg border border-boundary bg-surface py-2 pr-8 pl-9 text-sm text-muted shadow-md placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus-ring [&::-webkit-search-cancel-button]:appearance-none"
            enterkeyhint="search"
            :placeholder="t(TEXT, 'search.placeholder')"
            type="search"
        />

        <IconButton
            v-if="query.length > 0"
            :accessible-label="t(TEXT, 'clear.aria')"
            class="absolute top-1/2 right-1.5 -translate-y-1/2"
            shape="round"
            size="sm"
            @click="handleClear"
        >
            <XIcon class="size-3.5!" :stroke-width="1.5" />
        </IconButton>
    </div>
</template>
