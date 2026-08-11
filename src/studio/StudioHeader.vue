<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowBigLeftIcon, ArrowBigLeftDashIcon, ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, CircleArrowLeftIcon, CornerLeftUpIcon } from '@lucide/vue';

// Local Framework
import { assistantPaneIsVisible, viewportIsWide } from '@/state/appLayout';

// Options, Properties, Slots & Emits
const { overline, title, to } = defineProps<{ overline?: string; title: string; to?: string }>();
</script>

<template>
    <header
        class="mt-[env(safe-area-inset-top)] flex h-13.75 flex-none flex-col justify-center text-lg font-light"
        :class="viewportIsWide ? (assistantPaneIsVisible ? 'pl-4 pr-0' : 'pr-44 pl-4') : 'px-14'"
        data-region="StudioHeader"
    >
        <!-- Content indented from left and right to allow for logos when display is narrow.
             Content indented from right to allow for assistant bar when display is wide.
             NOTE: If width of logos or assistant bar changes, the above settings need to be adjusted accordingly. -->

        <component
            :is="to && to !== $route.query.sView ? 'RouterLink' : 'div'"
            class="min-w-0 text-content"
            :class="{
                'text-center': !viewportIsWide,
                'cursor-pointer text-accent hover:underline hover:decoration-blue-800/40 hover:underline-offset-2 dark:hover:decoration-blue-300/40':
                    to && to !== $route.query.sView
            }"
            :to="{ name: to, query: { ...$route.query, sView: to } }"
        >
            <!-- <div v-if="overline" class="truncate text-sm leading-tight">
                {{ overline }}
            </div> -->
            <div v-if="overline" class="flex min-w-0 items-center gap-x-0.5 leading-snug" :class="{ 'justify-center': !viewportIsWide }">
                <ChevronLeftIcon class="size-5 flex-none text-zinc-400" :stroke-width="2" />
                <span class="min-w-0 truncate">{{ overline }}</span>
            </div>
            <div class="flex min-w-0 items-center gap-x-0.5 leading-snug" :class="{ 'justify-center': !viewportIsWide }">
                <!-- <ChevronLeftIcon class="size-5 flex-none text-zinc-400" :stroke-width="2" /> -->
                <!-- <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5 text-zinc-400">
                    <path
                        d="M10.793 19.793a.707.707 0 0 0 1.207-.5V16a1 1 0 0 1 1-1h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-6a1 1 0 0 1-1-1V4.707a.707.707 0 0 0-1.207-.5l-6.94 6.94a1.207 1.207 0 0 0 0 1.707z"
                    />
                </svg> -->
                <span class="min-w-0 truncate">{{ title }}</span>
                <!-- <span class="size-5 flex-none" /> -->
            </div>
        </component>
    </header>
</template>
