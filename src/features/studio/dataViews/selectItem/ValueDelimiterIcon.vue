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

const { valueDelimiterId } = defineProps<{
    valueDelimiterId: ValueDelimiterId | undefined; // Undefined draws a blank of the same size, so labels beside it line up.
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const mark = computed(() => (valueDelimiterId == null ? undefined : VALUE_DELIMITER_MARKS[valueDelimiterId]));
</script>

<template>
    <!-- 1.25 times the text beside it, as the closed select's icons are. -->
    <span aria-hidden="true" class="flex size-[1.25em] flex-none items-center justify-center text-muted" data-region="ValueDelimiterIcon">
        <!-- Two-letter abbreviations are set smaller, so they fit the same square as a single character. -->
        <span v-if="typeof mark === 'string'" class="font-mono leading-none font-semibold" :class="mark.length > 1 ? 'text-[0.7em]' : 'text-[1.09em]'">{{ mark }}</span>
        <component :is="mark" v-else-if="mark" class="size-full" :stroke-width="1.5" />
    </span>
</template>
