<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

// ── Local Framework
import { studioPaneIsVisible, viewportIsWide } from '@/state/appLayout';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// 'end' puts the toolbar after the title and runs it up to the assistant toggle, so the right indent is dropped. 'title'
// puts it in the title's place, and the title stays only for screen readers.
const { overline, title, to, toolbarPlacement } = defineProps<{ overline?: string; title: string; to?: RouteLocationRaw; toolbarPlacement?: 'end' | 'title' }>();

defineSlots<{ toolbar?: () => unknown }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// A narrow display centres the title, and a toolbar after it would pull it off centre. A grid with two equal outer
// columns keeps it on the header's centre line: the empty left one is as wide as the toolbar, which also clears the
// studio toggle, so no indent is needed on either side.
const titleIsCentredBesideToolbar = computed(() => !viewportIsWide.value && toolbarPlacement === 'end');

// Indented to clear the app's fixed logo toggles. NOTE: If the width of the logos changes, these need adjusting.
const paddingClasses = computed(() => {
    if (titleIsCentredBesideToolbar.value) return ['pl-0', 'pr-0'];
    if (!viewportIsWide.value) return ['pl-14', 'pr-14'];
    if (studioPaneIsVisible.value) return ['pl-0', toolbarPlacement === 'end' ? 'pr-0' : 'pr-11'];
    return ['pl-11', toolbarPlacement === 'end' ? 'pr-0' : 'pr-12'];
});
</script>

<template>
    <header
        class="mt-[env(safe-area-inset-top)] h-13.75 flex-none items-center gap-x-3"
        :class="[paddingClasses, titleIsCentredBesideToolbar ? 'grid grid-cols-[1fr_minmax(0,auto)_1fr]' : 'flex']"
        data-region="AssistantHeader"
    >
        <component
            :is="to ? 'RouterLink' : 'div'"
            class="col-start-2 min-w-0 flex-1"
            :class="{
                'sr-only': toolbarPlacement === 'title',
                'text-center': !viewportIsWide,
                'cursor-pointer text-accent hover:text-accent-hover hover:underline hover:decoration-accent-hover/40 hover:underline-offset-2': to
            }"
            :to="to"
        >
            <!-- Overline -->
            <div v-if="overline" class="truncate text-sm leading-tight">
                {{ overline }}
            </div>

            <!-- Title -->
            <div class="truncate leading-snug">
                {{ title }}
            </div>
        </component>

        <!-- Toolbar - In the title's place, so aligned as the title would be. -->
        <div v-if="toolbarPlacement === 'title'" class="flex min-w-0 flex-1" :class="viewportIsWide ? 'justify-start' : 'justify-center'">
            <slot name="toolbar" />
        </div>

        <!-- Toolbar - After the title. Full height, so a toolbar can place itself against the header's top edge. -->
        <div v-else-if="toolbarPlacement === 'end'" class="col-start-3 flex flex-none justify-end self-stretch">
            <slot name="toolbar" />
        </div>
    </header>
</template>
