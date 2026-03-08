<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';

// Properties & Emits
const { breadcrumbs, displayIsWide } = defineProps<{ breadcrumbs?: { id: string; label: string }[]; displayIsWide: boolean; title: string }>();

// Local States

// Title indented from left when screen is compact, to allow for brand logo.
// Title indented from right when screen is wide and knowledge panel is not open, to allow for knowledge icon.
const titlePadding = computed(() => ({
    paddingLeft: displayIsWide ? undefined : '2.5rem',
    paddingRight: displayIsWide ? undefined : '2.5rem'
}));
</script>

<template>
    <div class="flex-none px-4">
        <div class="border-separator flex h-14 flex-col justify-center border-b text-lg font-light" :class="{ 'items-center': !displayIsWide }" :style="titlePadding">
            <div v-if="breadcrumbs" class="truncate text-xs">
                <div v-for="(breadcrumb, index) of breadcrumbs" :key="breadcrumb.id" class="flex gap-x-1">
                    <div v-if="index > 0">&gt;</div>
                    <div>{{ breadcrumb.label }}</div>
                </div>
            </div>

            <div class="truncate">{{ title }}</div>
        </div>
    </div>
</template>
