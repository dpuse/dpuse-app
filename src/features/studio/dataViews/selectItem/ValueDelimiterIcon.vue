<script setup lang="ts">
// ── External Dependencies & Registrations
import type { Component } from 'vue';
import { computed } from 'vue';
import { ArrowRightToLineIcon, SeparatorVerticalIcon, SpaceIcon } from '@lucide/vue';

// ── DPUse Framework
import type { ValueDelimiterId } from '@dpuse/dpuse-shared';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// A delimiter that can be seen shows as its own character. Space and tab cannot be seen, so they take an icon, and
// the two separator control characters show their standard abbreviations. 'Other' has no character of its own.
const VALUE_DELIMITER_MARKS: Record<ValueDelimiterId, Component | string> = {
    '': SeparatorVerticalIcon,
    ':': ':',
    ',': ',',
    '!': '!',
    '0x1E': 'RS',
    ';': ';',
    ' ': SpaceIcon,
    '\t': ArrowRightToLineIcon,
    _: '_',
    '0x1F': 'US',
    '|': '|'
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { isKeyCap, valueDelimiterId } = defineProps<{
    isKeyCap?: boolean; // Draws the mark inside an outline, for where it stands alone, such as a closed select in a toolbar short of room.
    valueDelimiterId: ValueDelimiterId | undefined; // Undefined draws a blank of the same size, so labels beside it line up.
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const mark = computed(() => (valueDelimiterId == null ? undefined : VALUE_DELIMITER_MARKS[valueDelimiterId]));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A mark inside a key cap is set smaller than one drawn alone, to leave room for the outline.
function constructMarkTextClass(textMark: string): string {
    if (textMark.length > 1) return isKeyCap ? 'text-[0.5625rem]' : 'text-[0.625rem]';
    return isKeyCap ? 'text-xs' : 'text-[0.9375rem]';
}
</script>

<template>
    <!-- Value Delimiter ─ A fixed 18px, as every toolbar icon is, so it does not change with the text beside it. As a key
         cap, the mark sits inside a small rounded outline, so a lone character such as a comma reads as an icon rather
         than stray punctuation. Beside its name in a list it needs no outline, so the mark is drawn larger and alone. No
         delimiter draws nothing but keeps the room, so labels beside it line up. -->
    <span
        aria-hidden="true"
        class="flex size-4.5 flex-none items-center justify-center rounded-[0.1875rem] text-muted"
        :class="{ 'border border-muted/60': isKeyCap && mark != null }"
        data-region="ValueDelimiterIcon"
    >
        <!-- Two-letter abbreviations are set smaller, so they fit the same square as a single character. -->
        <span v-if="typeof mark === 'string'" class="font-mono leading-none font-semibold" :class="constructMarkTextClass(mark)">{{ mark }}</span>
        <component :is="mark" v-else-if="mark" :class="isKeyCap ? 'size-3.5' : 'size-full'" :stroke-width="1.5" />
    </span>
</template>
