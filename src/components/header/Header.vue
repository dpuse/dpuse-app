<script setup lang="ts">
// App Core
import { useDisplayBreakpoint } from '@/composables/useDisplayBreakpoint';

// Properties & Emits
const { breadcrumbs, title, workbenchPaneIsHidden } = defineProps<{
    breadcrumbs?: { id: string; label: string }[];
    title: string;
    workbenchPaneIsHidden: boolean;
}>();

const { displayIsWide } = useDisplayBreakpoint();
</script>

<template>
    <div class="mt-[env(safe-area-inset-top)] flex-none px-4">
        <!-- Title indented from left and right when display is compact, to allow for logos. -->
        <div class="border-separator flex h-14 flex-col justify-center border-b text-lg font-light" :class="{ 'px-12': !displayIsWide || workbenchPaneIsHidden }">
            <div v-if="breadcrumbs" class="w-full truncate text-xs" :class="{ 'text-center': !displayIsWide }">
                <span v-for="(breadcrumb, index) of breadcrumbs" :key="breadcrumb.id"><span v-if="index > 0" class="mx-1">&gt;</span>{{ breadcrumb.label }}</span>
            </div>

            <div class="w-full truncate" :class="{ 'text-center': !displayIsWide }">{{ title }}</div>
        </div>
    </div>
</template>
