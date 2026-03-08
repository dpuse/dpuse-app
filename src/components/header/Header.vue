<script setup lang="ts">
// Properties & Emits
const { breadcrumbs, displayIsWide, title } = defineProps<{ breadcrumbs?: { id: string; label: string }[]; displayIsWide: boolean; title: string }>();
</script>

<template>
    <div class="flex-none px-4">
        <!-- Title indented from left and right when display is compact, to allow for logos. -->
        <div class="border-separator flex h-14 flex-col justify-center border-b text-lg font-light" :class="{ 'px-10': !displayIsWide }">
            <div v-if="breadcrumbs" class="w-full truncate text-xs" :class="{ 'text-center': !displayIsWide }">
                <span v-for="(breadcrumb, index) of breadcrumbs" :key="breadcrumb.id"><span v-if="index > 0" class="mx-1">&gt;</span>{{ breadcrumb.label }}</span>
            </div>

            <div class="w-full truncate" :class="{ 'text-center': !displayIsWide }">{{ title }}</div>
        </div>
    </div>
</template>
