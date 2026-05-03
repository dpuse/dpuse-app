<script setup lang="ts">
// Local (App) Framework
import { displayIsWide, workbenchPaneIsVisible } from '@/state/appLayout';

// Properties, Slots & Emits
const { overline, overlineTo, title, titleTo } = defineProps<{ overline: string; overlineTo?: string; title: string; titleTo?: string }>();
</script>

<template>
    <header class="mt-[env(safe-area-inset-top)] flex-none">
        <!-- Content indented from left and right when display is compact, to allow for logos. -->
        <div class="border-separator flex h-14 flex-col justify-center border-b text-lg font-light" :class="{ 'px-12': !displayIsWide || !workbenchPaneIsVisible }">
            <!-- Overline Row -->
            <component
                :is="overlineTo && overlineTo !== $route.query.wbView ? 'RouterLink' : 'div'"
                :to="{ name: overlineTo, query: { ...$route.query, wbView: overlineTo } }"
                class="w-full truncate text-xs"
                :class="{ 'text-center': !displayIsWide }"
            >
                {{ overline }}
            </component>

            <!-- Title Row -->
            <component
                :is="titleTo && titleTo !== $route.query.wbView ? 'RouterLink' : 'div'"
                :to="{ name: titleTo, query: { ...$route.query, wbView: titleTo } }"
                class="w-full truncate"
                :class="{ 'text-center': !displayIsWide }"
            >
                {{ title }}
            </component>
        </div>
    </header>
</template>
