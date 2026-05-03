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
    items.map((item, index) => {
        const isDisabled = index === items.length - 1 && disableLast;
        const isLink = !isDisabled && item.to != null;
        const isButton = !isDisabled && item.to == null;
        return { item, isDisabled, isLink, isButton };
    })
);
</script>

<template>
    <div class="flex min-w-0 items-center overflow-hidden">
        <template v-for="({ item, isDisabled, isLink, isButton }, index) in enrichedItems" :key="item.id">
            <!-- Breadcrumb Separator -->
            <span v-if="index > 0" class="mx-1.5 flex-none text-zinc-400">/</span>

            <!-- Breadcrumb Body -->
            <component
                :is="isLink ? 'RouterLink' : isButton ? Button : 'div'"
                v-bind="isButton ? { variant: 'minimal' } : {}"
                :aria-disabled="isDisabled || undefined"
                :aria-label="item.label"
                class="flex items-center"
                :class="[
                    item.icon ? 'flex-none' : 'max-w-full min-w-0 overflow-hidden',
                    isDisabled
                        ? 'cursor-default text-zinc-500 dark:text-zinc-500'
                        : 'cursor-pointer text-blue-800 transition-colors hover:text-blue-600 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none dark:text-blue-400 dark:hover:text-blue-300 dark:focus-visible:ring-blue-500'
                ]"
                :to="isLink ? { name: item.to, query: { ...$route.query, wbView: item.to } } : undefined"
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
