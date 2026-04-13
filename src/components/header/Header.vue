<script setup lang="ts">
// App Core
import { displayIsWide, workbenchPaneIsVisible } from '@/state/appLayout';

// Properties & Emits
const { breadcrumbs, title, to } = defineProps<{ breadcrumbs?: { id: string; label: string; to?: string }[]; title: string; to?: string }>();
</script>

<template>
    <header class="mt-[env(safe-area-inset-top)] flex-none px-4">
        <!-- Content indented from left and right when display is compact, to allow for logos. -->
        <div class="border-separator flex h-14 flex-col justify-center border-b text-lg font-light" :class="{ 'px-12': !displayIsWide || !workbenchPaneIsVisible }">
            <!-- Breadcrumbs -->
            <div v-if="breadcrumbs" class="w-full truncate text-xs" :class="{ 'text-center': !displayIsWide }">
                <!-- TODO: Prior version: <span v-for="(breadcrumb, index) in breadcrumbs" :key="breadcrumb.id"><span v-if="index > 0" class="mx-1">&gt;</span>{{ breadcrumb.label }}</span> -->
                <!-- TODO: Is there enough room around breadcrumbs to effectively tap on touch devices? -->
                <component
                    :is="breadcrumb.to ? 'RouterLink' : 'div'"
                    v-for="(breadcrumb, index) in breadcrumbs"
                    :key="breadcrumb.id"
                    :to="{ name: breadcrumb.to, query: { ...$route.query, wbView: breadcrumb.to } }"
                    class="w-full truncate"
                    :class="{ 'text-center': !displayIsWide }"
                >
                    <span v-if="index > 0" class="mx-1">&gt;</span>{{ breadcrumb.label }}
                </component>
            </div>

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
