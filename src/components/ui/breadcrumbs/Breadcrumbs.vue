<script setup lang="ts" generic="T extends BreadcrumbConfig">
// Local Framework
import type { BreadcrumbConfig } from '@/composables/useBreadcrumbs';

// Properties, Slots & Emits
const { items = [] } = defineProps<{ items?: T[] }>();
defineEmits<{ select: [index: number] }>();
</script>

<template>
    <div v-if="items" class="flex">
        <!-- TODO: Is there enough room around breadcrumbs to effectively tap on touch devices? -->
        <component
            :is="item.to ? 'RouterLink' : 'div'"
            v-for="(item, index) in items"
            :key="item.id"
            :to="{ name: item.to, query: { ...$route.query, wbView: item.to } }"
            class="min-w-0 truncate"
            @click="$emit('select', index)"
        >
            <span v-if="index > 0" class="mx-1">&gt;</span>{{ item.label }}
        </component>
    </div>
</template>
