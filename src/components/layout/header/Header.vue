<script setup lang="ts">
// Local (App) Framework
import { displayIsWide, knowledgePaneIsVisible, workbenchPaneIsVisible } from '@/state/appLayout';

// Options, Properties, Slots & Emits
const { overline, title, to } = defineProps<{ overline: string; title: string; to?: string }>();
</script>

<template>
    <header class="mt-[env(safe-area-inset-top)] flex-none">
        <!-- Content indented from left and right to allow for logos when display is narrow.
             Content indented from right to allow for knowledge bar when display is wide.
             NOTE: If width of logos or knowledge bar changes, the following settings need to be adjusted accordingly. -->
        <div
            class="flex h-14 flex-col justify-center text-lg font-light"
            :class="{ 'px-12': !displayIsWide || !workbenchPaneIsVisible, 'pr-44': displayIsWide && workbenchPaneIsVisible && !knowledgePaneIsVisible }"
        >
            <!-- Overline & Title -->
            <component
                :is="to && to !== $route.query.wbView ? 'RouterLink' : 'div'"
                :to="{ name: to, query: { ...$route.query, wbView: to } }"
                class="min-w-0 truncate leading-snug"
                :class="{ 'text-center': !displayIsWide }"
            >
                <div class="truncate text-[13px] leading-tight">{{ overline }}</div>
                <div class="truncate leading-snug">{{ title }}</div>
            </component>
        </div>
    </header>
</template>
