<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowLeftIcon } from '@lucide/vue';

// Local Framework
import { assistantPaneIsVisible, viewportIsWide } from '@/state/appLayout';

// Options, Properties, Slots & Emits
const { overline, title, to } = defineProps<{ overline?: string; title: string; to?: string }>();
</script>

<template>
    <header
        class="mt-[env(safe-area-inset-top)] flex h-13.75 flex-none flex-col justify-center text-lg"
        :class="viewportIsWide ? (assistantPaneIsVisible ? 'pl-4 pr-0' : 'pr-44 pl-4') : 'px-14'"
        data-region="StudioHeader"
    >
        <!-- Content indented from left and right to allow for logos when display is narrow.
             Content indented from right to allow for assistant bar when display is wide.
             NOTE: If width of logos or assistant bar changes, the above settings need to be adjusted accordingly. -->

        <component
            :is="to && to !== $route.query.sView ? 'RouterLink' : 'div'"
            class="min-w-0 text-content"
            :class="{ 'text-center': !viewportIsWide, 'group cursor-pointer': to && to !== $route.query.sView }"
            :to="{ name: to, query: { ...$route.query, sView: to } }"
        >
            <!-- Overline -->
            <div
                v-if="overline"
                class="flex min-w-0 items-center gap-x-0.5 text-sm leading-tight text-muted group-hover:text-blue-500"
                :class="{ 'justify-center': !viewportIsWide }"
            >
                <ArrowLeftIcon class="size-4 flex-none" :stroke-width="2" />
                <span class="min-w-0 truncate">{{ overline }}</span>
                <span class="size-4 flex-none" />
            </div>

            <!-- Title -->
            <div class="ml-0.5 truncate leading-snug font-light">{{ title }}</div>
        </component>
    </header>
</template>
