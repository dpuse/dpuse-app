<script setup lang="ts">
// ── External Dependencies & Registrations
import type { Component } from 'vue';
import { AsteriskIcon, FingerprintPatternIcon, KeyRoundIcon, XIcon } from '@lucide/vue';

// ── Local Framework
import type { ColumnFacts } from '@/features/studio/dataViews/_columns/previewColumnRows';
import { t } from '@/state/locale';
import { TEXT } from './ColumnTabMarks_.json';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { columnFacts, isIgnored, isTypeChosen, typeIcon, typeText } = defineProps<{
    columnFacts: ColumnFacts;
    isIgnored?: boolean; // The user chose to leave the column out of the load.
    isTypeChosen?: boolean; // The user chose the column's type, in place of the detected one.
    typeIcon: Component | undefined;
    typeText: string; // Names the type for screen readers, because the icon alone does not say it.
}>();
</script>

<template>
    <!-- Key, Unique and Mandatory ─ The Overview's facts, under the same rules and in the same order. A key shows in place
         of the fingerprint, because a key is unique too. -->
    <span v-if="columnFacts.isKey === true || columnFacts.isUnique === true || columnFacts.isMandatory === true" class="ml-1 flex flex-none items-center gap-x-0.5 text-muted" :class="{ 'opacity-50': isIgnored }">
        <span v-if="columnFacts.isKey === true" :aria-label="t(TEXT, 'key.aria')" role="img" :title="t(TEXT, 'key.aria')">
            <KeyRoundIcon aria-hidden="true" class="size-3.5" :stroke-width="1.5" />
        </span>
        <span v-else-if="columnFacts.isUnique === true" :aria-label="t(TEXT, 'unique.aria')" role="img" :title="t(TEXT, 'unique.aria')">
            <FingerprintPatternIcon aria-hidden="true" class="size-3.5" :stroke-width="1.5" />
        </span>
        <span v-if="columnFacts.isMandatory === true" :aria-label="t(TEXT, 'mandatory.aria')" role="img" :title="t(TEXT, 'mandatory.aria')">
            <AsteriskIcon aria-hidden="true" class="size-3.5" :stroke-width="1.5" />
        </span>
    </span>
    <!-- Type Icon ─ Shows the column's type after its name. The type is chosen in the column's detail, so a click on the
         icon opens the detail like the rest of the tab. The dot marks a type the user chose. A ✕ in its place marks a
         column left out of the load, because its type no longer matters then.
         'pointer-events-none' lets a click through to the tab, because the dot's positioning would otherwise lift the
         icon above the tab's overlay. -->
    <span :aria-label="typeText" class="pointer-events-none relative ml-1.5 flex flex-none items-center text-sm text-muted" role="img">
        <component :is="typeIcon" aria-hidden="true" class="size-[1.25em] flex-none" :class="{ 'opacity-50': isIgnored }" />
        <XIcon v-if="isIgnored" aria-hidden="true" class="absolute -top-1 -right-1 size-2.5 rounded-full bg-surface text-danger-text" :stroke-width="3" />
        <span v-else-if="isTypeChosen" aria-hidden="true" class="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-muted" />
    </span>
</template>
