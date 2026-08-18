<script setup lang="ts">
// Local Framework
import { studioPaneIsVisible, viewportIsWide } from '@/state/appLayout';

// Options, Properties, Slots & Emits
const { overline, title, to } = defineProps<{ overline?: string; title: string; to?: string }>();
</script>

<template>
    <header
        class="mt-[env(safe-area-inset-top)] flex h-13.75 flex-none flex-col justify-center text-lg font-light"
        :class="viewportIsWide ? (studioPaneIsVisible ? 'pr-40 pl-0' : 'pr-40 pl-10') : 'px-14'"
        data-region="AssistantHeader"
    >
        <!-- Content indented from left and right to allow for logos when display is narrow.
             Content indented from right to allow for assistant bar when display is wide.
             NOTE: If width of logos or assistant bar changes, the following settings need to be adjusted accordingly. -->

        <component
            :is="to && to !== $route.query.sView ? 'RouterLink' : 'div'"
            class="min-w-0"
            :class="{
                'text-center': !viewportIsWide,
                'cursor-pointer text-sky-700 hover:underline hover:decoration-sky-800/40 hover:underline-offset-2 dark:text-sky-400 dark:hover:decoration-sky-300/40':
                    to && to !== $route.query.sView
            }"
            :to="{ name: to, query: { ...$route.query, sView: to } }"
        >
            <div v-if="overline" class="truncate text-sm leading-tight">
                {{ overline }}
            </div>
            <div class="truncate leading-snug">
                {{ title }}
            </div>
        </component>
    </header>
</template>
