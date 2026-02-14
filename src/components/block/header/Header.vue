<script setup lang="ts">
// External dependencies
import { computed } from 'vue';

// Properties
const properties = defineProps<{ breadcrumbs?: { id: string; label: string }[]; isWideDisplay: boolean; title: string }>();

// Title indented from left when screen is compact, to allow for brand logo
// Title indented from right when screen is wide and knowledge panel is not open, to allow for knowledge icon
const titlePadding = computed(() => ({
    paddingLeft: properties.isWideDisplay ? undefined : '2.5rem',
    paddingRight: properties.isWideDisplay ? undefined : '2.5rem'
}));
</script>

<template>
    <div class="flex-none px-4">
        <div class="border-separator flex h-14 flex-col justify-center border-b text-lg font-light" :class="{ 'items-center': !isWideDisplay }" :style="titlePadding">
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
