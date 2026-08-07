<script setup lang="ts">
// Local Framework
import { studioPaneIsVisible, viewportIsWide } from '@/state/appLayout';

// Options, Properties, Slots & Emits
const { overline, title, to } = defineProps<{ overline: string; title: string; to?: string }>();
</script>

<template>
    <header
        class="mt-[env(safe-area-inset-top)] flex h-13.75 flex-none flex-col justify-center text-lg font-light"
        :class="viewportIsWide ? (studioPaneIsVisible ? 'pr-40 pl-0' : 'pr-40 pl-10') : 'px-14'"
        data-region="AssistantHeader"
    >
        <!-- Content indented from left and right to allow for logos when display is narrow.
             Content indented from right to allow for knowledge bar when display is wide.
             NOTE: If width of logos or knowledge bar changes, the following settings need to be adjusted accordingly. -->

        <component
            :is="to && to !== $route.query.wbView ? 'RouterLink' : 'div'"
            class="min-w-0"
            :class="{
                'text-center': !viewportIsWide,
                'cursor-pointer text-accent hover:underline hover:decoration-blue-800/40 hover:underline-offset-2 dark:hover:decoration-blue-300/40':
                    to && to !== $route.query.wbView
            }"
            :to="{ name: to, query: { ...$route.query, wbView: to } }"
        >
            <div class="truncate text-sm leading-tight">
                {{ overline }}
            </div>
            <div class="truncate leading-snug">
                {{ title }}
            </div>
        </component>
    </header>
</template>
