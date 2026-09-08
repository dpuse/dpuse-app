<script setup lang="ts">
// The action a panel ends on, pinned to its bottom-right corner: commit what is selected, or add another one. Its
// glyph sits on the side it points — leading where it means "one more of these", trailing where it means "onward" —
// and the padding follows, tighter against the icon than against the words.
//
// One component rather than the pair this replaces, which differed only by an icon and a side and had already drifted
// into two mirrored class strings maintained apart.

// ── External Dependencies & Registrations
import type { Component } from 'vue';

// ── Static Components
import BaseButton from '@/components/ui/button/BaseButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    icon: Component;
    // Where the glyph sits relative to the label. Trailing reads as progress, leading as addition.
    iconIsLeading?: boolean;
    label: string;
}
const { icon, iconIsLeading, label } = defineProps<Properties>();
</script>

<template>
    <BaseButton
        class="absolute right-3 bottom-(--safe-bottom-offset) inline-flex h-9 items-center gap-x-1 rounded-full border border-selected-border bg-selected text-selected-text shadow-md hover:bg-selected-hover"
        :class="iconIsLeading ? 'pr-3 pl-2' : 'pr-2 pl-3'"
        data-region="ActionButton"
    >
        <component :is="icon" v-if="iconIsLeading" class="size-5" :stroke-width="1.25" />
        <span class="text-sm">{{ label }}</span>
        <component :is="icon" v-if="!iconIsLeading" class="size-5" :stroke-width="1.25" />
    </BaseButton>
</template>
