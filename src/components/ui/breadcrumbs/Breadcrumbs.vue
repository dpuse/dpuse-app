<script setup lang="ts" generic="T extends BreadcrumbConfig">
// External Dependencies
import { computed } from 'vue';

// Local (App) Framework
import type { BreadcrumbConfig } from '@/composables/useBreadcrumbs';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// Options, Properties, Slots & Emits
const { items = [], disableLast = true } = defineProps<{ items?: T[]; disableLast?: boolean }>();
defineEmits<{ select: [index: number, item: T] }>();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const enrichedItems = computed(() =>
    items.map((item, index) => ({
        item,
        isDisabled: index === items.length - 1 && disableLast
    }))
);
</script>

<template>
    <div class="flex min-w-0 items-center overflow-hidden">
        <template v-for="({ item, isDisabled }, index) in enrichedItems" :key="item.id">
            <!-- Breadcrumb Separator -->
            <span v-if="index > 0" class="mx-1.5 flex-none text-subtle">/</span>

            <!-- Breadcrumb Body -->
            <component
                :is="isDisabled ? 'div' : Button"
                :to="!isDisabled && item.to != null ? { name: item.to, query: { ...$route.query, wbView: item.to } } : undefined"
                :aria-disabled="isDisabled || undefined"
                :aria-label="item.label"
                shape="minimal"
                class="flex items-center"
                :class="[
                    item.icon ? 'flex-none' : 'max-w-full min-w-0 overflow-hidden',
                    isDisabled
                        ? 'cursor-default text-muted'
                        : 'cursor-pointer text-accent transition-colors hover:text-blue-600 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none dark:hover:text-blue-200 dark:focus-visible:ring-blue-400'
                ]"
                @click="!isDisabled ? $emit('select', index, item) : undefined"
            >
                <!-- Display as icon. -->
                <span v-if="item.icon">
                    <component :is="item.icon" aria-hidden="true" class="size-4.75!" />
                </span>

                <!-- Display as label. -->
                <span v-else class="min-w-0 truncate">{{ item.label }}</span>
            </component>
        </template>
    </div>
</template>
