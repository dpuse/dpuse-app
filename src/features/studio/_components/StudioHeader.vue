<script setup lang="ts">
// ── Local Framework
import { assistantPaneIsVisible } from '@/state/appPanes';
import { viewportIsWide } from '@/state/device';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { overline, title, titleIsPending } = defineProps<{
    overline?: string; // The part of the app a task belongs to. Left out on a screen whose title already names it.
    title: string;
    titleIsPending?: boolean; // The title is a placeholder, such as 'Loading…', until what it names has loaded.
}>();
</script>

<template>
    <header
        class="mt-[env(safe-area-inset-top)] flex h-13.75 flex-none flex-col justify-center"
        :class="viewportIsWide ? (assistantPaneIsVisible ? 'pr-0 pl-page' : 'pr-16 pl-page') : 'pr-16 pl-16'"
        data-region="StudioHeader"
    >
        <!-- Content indented from left and right to allow for logos when display is narrow.
             NOTE: If width of logos changes, the above settings need to be adjusted accordingly. -->

        <!-- Overline ─ Names the part of the app a task belongs to, above the task's own title. Plain text, not a link:
             the views beside the tasks lead back, and the rail leads everywhere else. Centred on narrow screens as the
             title is. Long text is cut off sideways only ('overflow-x: clip'), because hiding overflow on both axes
             would clip the tails of letters like 'g'. -->
        <div v-if="overline" class="max-w-full min-w-0 overflow-x-clip text-sm leading-tight text-ellipsis whitespace-nowrap text-muted" :class="{ 'text-center': !viewportIsWide }">
            {{ overline }}
        </div>

        <!-- Title ─ A placeholder title is for screen readers only, so it never flashes on screen during a short load.
             The real title fades in when it replaces the placeholder. A title already known on first render just shows,
             because 'Transition' does not run on first render. The heading keeps one line's height while the title is
             blank, so the overline does not move as the title arrives. -->
        <h1 class="ml-0.5 min-h-lh truncate leading-snug text-content" :class="{ 'text-center': !viewportIsWide }">
            <Transition enter-active-class="dpuse-action-fade-enter-active" enter-from-class="dpuse-action-fade-enter-from">
                <span v-if="titleIsPending" class="sr-only">{{ title }}</span>
                <span v-else>{{ title }}</span>
            </Transition>
        </h1>
    </header>
</template>
