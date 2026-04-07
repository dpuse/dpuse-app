<script setup lang="ts">
// App Core
import { useDisplayBreakpoint } from '@/state/useDisplayBreakpoint';

// Properties & Emits
const { breadcrumbs, title, to, workbenchPaneIsHidden } = defineProps<{
    breadcrumbs?: { id: string; label: string }[];
    title: string;
    to?: string;
    workbenchPaneIsHidden: boolean;
}>();

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { displayIsWide } = useDisplayBreakpoint();
</script>

<template>
    <div class="mt-[env(safe-area-inset-top)] flex-none px-4">
        <!-- Title indented from left and right when display is compact, to allow for logos. -->
        <div class="border-separator flex h-14 flex-col justify-center border-b text-lg font-light" :class="{ 'px-12': !displayIsWide || workbenchPaneIsHidden }">
            <div v-if="breadcrumbs" class="w-full truncate text-xs" :class="{ 'text-center': !displayIsWide }">
                <span v-for="(breadcrumb, index) in breadcrumbs" :key="breadcrumb.id"><span v-if="index > 0" class="mx-1">&gt;</span>{{ breadcrumb.label }}</span>
            </div>

            <component
                :is="to ? 'RouterLink' : 'div'"
                :to="{ name: to, query: { ...$route.query, wbView: to } }"
                class="w-full truncate"
                :class="{ 'text-center': !displayIsWide }"
            >
                {{ title }}
            </component>
        </div>
    </div>
</template>
