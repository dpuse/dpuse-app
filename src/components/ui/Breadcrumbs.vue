<script setup lang="ts" generic="T extends BreadcrumbConfig">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── Local Framework
import type { BreadcrumbConfig } from '@/composables/useBreadcrumbs';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    items?: T[];
    disableLast?: boolean;
}
const { items = [], disableLast } = defineProps<Properties>();
defineEmits<{ select: [index: number, item: T] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const enrichedItems = computed(() =>
    items.map((item, index) => ({
        item,
        isDisabled: index === items.length - 1 && disableLast
    }))
);
</script>

<template>
    <div class="flex min-w-0 items-center overflow-hidden" data-region="Breadcrumbs">
        <template v-for="({ item, isDisabled }, index) in enrichedItems" :key="item.id">
            <!-- Breadcrumb Separator -->
            <span v-if="index > 0" class="mx-1.5 flex-none text-subtle">/</span>

            <!-- Breadcrumb Body -->
            <component
                :is="isDisabled ? 'div' : ActionWrapper"
                :to="!isDisabled && item.to != null ? { name: item.to, query: $route.query } : undefined"
                :aria-disabled="isDisabled || undefined"
                :aria-label="item.label"
                class="flex items-center"
                :class="[
                    item.icon ? 'flex-none' : 'max-w-full min-w-0 overflow-hidden',
                    isDisabled
                        ? 'cursor-default text-muted'
                        : 'cursor-pointer text-accent transition-colors hover:text-accent-hover focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'
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
