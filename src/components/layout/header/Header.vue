<script setup lang="ts">
// Local (App) Framework
import { displayIsWide, knowledgePaneIsVisible, workbenchPaneIsVisible } from '@/state/appLayout';

// Options, Properties, Slots & Emits
const { overline, title, to } = defineProps<{ overline: string; title: string; to?: string }>();
</script>

<template>
    <header
        class="mt-[env(safe-area-inset-top)] flex h-13.75 flex-none flex-col justify-center text-lg font-light"
        :class="{
            'px-14': !displayIsWide || !workbenchPaneIsVisible,
            'pr-44 pl-4': displayIsWide && workbenchPaneIsVisible && !knowledgePaneIsVisible
        }"
        data-component="Header"
    >
        <!-- Content indented from left and right to allow for logos when display is narrow.
             Content indented from right to allow for knowledge bar when display is wide.
             NOTE: If width of logos or knowledge bar changes, the following settings need to be adjusted accordingly. -->

        <component
            :is="to && to !== $route.query.wbView ? 'RouterLink' : 'div'"
            class="min-w-0"
            :class="{
                'text-center': !displayIsWide,
                'text-accent cursor-pointer hover:underline hover:decoration-blue-800/40 hover:underline-offset-2 dark:hover:decoration-blue-300/40':
                    to && to !== $route.query.wbView
            }"
            :to="{ name: to, query: { ...$route.query, wbView: to } }"
        >
            <div class="truncate text-sm leading-tight">{{ overline }}</div>
            <div class="truncate leading-snug">{{ title }}</div>
        </component>
    </header>
</template>
