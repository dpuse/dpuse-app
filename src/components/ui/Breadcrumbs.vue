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
    disabledIndex?: number; // Shows the crumb at this position as plain text, such as the open folder before a chosen item.
}
const { items = [], disableLast, disabledIndex } = defineProps<Properties>();
defineSlots<{ icon?(properties: { item: T }): unknown }>(); // Rendered in place of a crumb's icon component, e.g. a config's own SVG icon.
defineEmits<{ select: [index: number, item: T] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const enrichedItems = computed(() =>
    items.map((item, index) => ({
        item,
        isDisabled: index === disabledIndex || (index === items.length - 1 && disableLast),
        isLast: index === items.length - 1
    }))
);
</script>

<template>
    <div class="flex min-w-0 items-center overflow-hidden" data-region="Breadcrumbs">
        <template v-for="({ item, isDisabled, isLast }, index) in enrichedItems" :key="item.id">
            <!-- Breadcrumb Separator -->
            <span v-if="index > 0" class="mx-1.5 flex-none text-subtle">/</span>

            <!-- Breadcrumb Body -->
            <component
                :is="isDisabled ? 'div' : ActionWrapper"
                :to="isDisabled ? undefined : item.to"
                :aria-disabled="isDisabled || undefined"
                :aria-label="item.label"
                class="flex items-center"
                :title="item.icon ? item.label : undefined"
                :class="[
                    item.icon ? 'flex-none' : 'max-w-full min-w-0 overflow-hidden',
                    isDisabled
                        ? 'cursor-default text-muted'
                        : 'cursor-pointer transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                    // The last crumb is the current item, so it reads as text and turns blue only on hover, while still
                    // working as a link, e.g. one that scrolls a list back to the item.
                    isDisabled ? '' : isLast ? 'text-content hover:text-accent' : 'text-accent hover:text-accent-hover'
                ]"
                @click="!isDisabled ? $emit('select', index, item) : undefined"
            >
                <!-- Display as icon. An icon crumb is named by its tooltip, because the icon alone may not say what it
                     is. -->
                <span v-if="item.icon">
                    <slot name="icon" :item="item">
                        <component :is="item.icon" aria-hidden="true" class="size-5!" :stroke-width="1.5" />
                    </slot>
                </span>

                <!-- Display as label. -->
                <span v-else class="min-w-0 truncate">{{ item.label }}</span>
            </component>
        </template>
    </div>
</template>
