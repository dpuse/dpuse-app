<script setup lang="ts" generic="T extends BreadcrumbConfig">
// Local Framework
import type { BreadcrumbConfig } from '@/composables/useBreadcrumbs';

// Properties, Slots & Emits
const { items = [] } = defineProps<{ items?: T[] }>();
defineEmits<{ select: [index: number, item: T] }>();
</script>

<template>
    <div v-if="items" class="flex min-w-0 overflow-hidden">
        <!-- TODO: Is there enough room around breadcrumbs to effectively tap on touch devices? -->
        <component
            :is="item.to != null && !item.disabled ? 'RouterLink' : item.disabled ? 'div' : 'button'"
            v-for="(item, index) in items"
            :key="item.id"
            :aria-disabled="item.disabled || undefined"
            class="min-w-0 truncate"
            :class="item.disabled ? 'text-zinc-400' : 'text-zinc-700 hover:text-zinc-950'"
            :to="item.to == null || item.disabled ? undefined : { name: item.to, query: { ...$route.query, wbView: item.to } }"
            :type="item.to == null && !item.disabled ? 'button' : undefined"
            @click="item.disabled ? undefined : $emit('select', index, item)"
        >
            <span v-if="index > 0" class="mx-1">&gt;</span>{{ item.label }}
        </component>
    </div>
</template>
