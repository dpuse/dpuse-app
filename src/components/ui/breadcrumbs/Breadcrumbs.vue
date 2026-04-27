<script setup lang="ts" generic="T extends BreadcrumbConfig">
// Local Framework
import type { BreadcrumbConfig } from '@/composables/useBreadcrumbs';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// Properties, Slots & Emits
const { items = [] } = defineProps<{ items?: T[] }>();
defineEmits<{ select: [index: number, item: T] }>();
</script>

<template>
    <div class="flex min-w-0 items-center overflow-hidden">
        <template v-for="(item, index) in items" :key="item.id">
            <!-- Separator -->
            <span v-if="index > 0" class="mx-1.5 flex-none text-zinc-400">/</span>

            <!-- Body -->
            <component
                :is="index < items.length - 1 && item.to != null ? 'RouterLink' : index < items.length - 1 ? Button : 'div'"
                v-bind="index < items.length - 1 && item.to == null ? { variant: 'minimal' } : {}"
                :aria-disabled="index === items.length - 1 || undefined"
                :aria-label="item.label"
                class="flex h-full items-center"
                :class="[
                    item.icon ? 'flex-none' : 'max-w-full min-w-0 overflow-hidden',
                    index === items.length - 1
                        ? 'cursor-default text-zinc-500 dark:text-zinc-500'
                        : 'cursor-pointer text-blue-800 transition-colors hover:text-blue-600 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none dark:text-blue-400 dark:hover:text-blue-300 dark:focus-visible:ring-blue-500'
                ]"
                :to="index === items.length - 1 || item.to == null ? undefined : { name: item.to, query: { ...$route.query, wbView: item.to } }"
                @click="index < items.length - 1 ? $emit('select', index, item) : undefined"
            >
                <span v-if="item.icon" class="flex-none">
                    <component :is="item.icon" aria-hidden="true" class="size-4.75!" />
                </span>
                <span v-else class="min-w-0 truncate">{{ item.label }}</span>
            </component>
        </template>
    </div>
</template>
