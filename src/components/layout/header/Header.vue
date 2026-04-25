<script setup lang="ts">
// Local Framework
import { displayIsWide, workbenchPaneIsVisible } from '@/state/appLayout';

// Local Components - Static
import Breadcrumbs, { type BreadcrumbConfig } from '@/components/ui/breadcrumbs/Breadcrumbs.vue';

// Properties, Slots & Emits
const { breadcrumbs, title, to } = defineProps<{ breadcrumbs?: BreadcrumbConfig[]; title: string; to?: string }>();
</script>

<template>
    <header class="mt-[env(safe-area-inset-top)] flex-none px-4">
        <!-- Content indented from left and right when display is compact, to allow for logos. -->
        <div class="border-separator flex h-14 flex-col justify-center border-b text-lg font-light" :class="{ 'px-12': !displayIsWide || !workbenchPaneIsVisible }">
            <!-- Breadcrumbs -->
            <Breadcrumbs class="w-full truncate text-xs" :class="{ 'text-center': !displayIsWide }" :items="breadcrumbs" />

            <!-- Title -->
            <component
                :is="to && to !== $route.query.wbView ? 'RouterLink' : 'div'"
                :to="{ name: to, query: { ...$route.query, wbView: to } }"
                class="w-full truncate"
                :class="{ 'text-center': !displayIsWide }"
            >
                {{ title }}
            </component>
        </div>
    </header>
</template>
