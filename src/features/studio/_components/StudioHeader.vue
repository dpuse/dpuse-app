<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowLeftIcon } from '@lucide/vue';
import type { RouteLocationRaw } from 'vue-router';

// ── Local Framework
import { assistantPaneIsVisible } from '@/state/appPanes';
import { viewportIsWide } from '@/state/device';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { overline, title, to } = defineProps<{ overline?: string; title: string; to?: RouteLocationRaw }>();
</script>

<template>
    <header
        class="mt-[env(safe-area-inset-top)] flex h-13.75 flex-none flex-col justify-center"
        :class="viewportIsWide ? (assistantPaneIsVisible ? 'pr-0 pl-page' : 'pr-16 pl-page') : 'pr-16 pl-16'"
        data-region="StudioHeader"
    >
        <!-- Content indented from left and right to allow for logos when display is narrow.
             NOTE: If width of logos changes, the above settings need to be adjusted accordingly. -->

        <!-- Overline ─ The back link. Only the overline goes back, so the link is named for where it leads and the title
             stays a plain heading. Sized to its text, centred on narrow screens as the text is, and at least 24px tall
             so it is easy to hit. The extra height goes above the text and is pulled up out of the way, so the text
             sits as close to the title as before. -->
        <component
            :is="to ? 'RouterLink' : 'div'"
            v-if="overline"
            class="-mt-1.5 flex min-h-6 w-fit max-w-full min-w-0 items-end text-sm leading-tight text-muted"
            :class="{ 'mx-auto': !viewportIsWide, 'hover:text-blue-500': to }"
            :to="to"
        >
            <!-- The arrow and text are centred on each other inside the bottom-aligned link. 'text-box' trims the font's
                 empty space above the capitals and below the baseline, so the arrow centres on the letters themselves,
                 as 'TaskBar' does for its digits. Long text is cut off sideways only ('overflow-x: clip'), because
                 hiding overflow on both axes would clip the tails of letters like 'g' below the trimmed box. -->
            <span class="flex min-w-0 items-center gap-x-0.5">
                <ArrowLeftIcon class="size-4 flex-none" :stroke-width="2" />
                <span class="min-w-0 overflow-x-clip text-ellipsis whitespace-nowrap [text-box:trim-both_cap_alphabetic]">{{ overline }}</span>
                <span class="size-4 flex-none" />
            </span>
        </component>

        <!-- Title -->
        <h1 class="ml-0.5 truncate leading-snug text-content" :class="{ 'text-center': !viewportIsWide }">{{ title }}</h1>
    </header>
</template>
