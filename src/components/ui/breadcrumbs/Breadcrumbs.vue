<script setup lang="ts" generic="T extends BreadcrumbConfig">
// Local Framework
import type { BreadcrumbConfig } from '@/composables/useBreadcrumbs';

// Properties, Slots & Emits
const { items = [] } = defineProps<{ items?: T[] }>();
defineEmits<{ select: [index: number, item: T] }>();
</script>

<template>
    <div v-if="items" class="flex min-w-0 items-center overflow-hidden">
        <!-- TODO: Is there enough room around breadcrumbs to effectively tap on touch devices? -->
        <component
            :is="index < items.length - 1 && item.to != null ? 'RouterLink' : index < items.length - 1 ? 'button' : 'div'"
            v-for="(item, index) in items"
            :key="item.id"
            :aria-disabled="index === items.length - 1 || undefined"
            class="min-w-0 truncate"
            :class="index === items.length - 1 ? 'text-zinc-400' : 'text-zinc-700 hover:text-zinc-950'"
            :aria-label="item.label"
            :title="item.label"
            :to="index === items.length - 1 || item.to == null ? undefined : { name: item.to, query: { ...$route.query, wbView: item.to } }"
            :type="index < items.length - 1 && item.to == null ? 'button' : undefined"
            @click="index < items.length - 1 ? $emit('select', index, item) : undefined"
        >
            <span v-if="index > 0" class="mx-1">&gt;</span>

            <component :is="item.icon" v-if="item.icon" aria-hidden="true" class="inline size-5! align-text-bottom" />
            <span v-else>{{ item.label }}</span>
        </component>
    </div>
</template>
