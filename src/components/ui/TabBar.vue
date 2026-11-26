<script setup lang="ts" generic="T extends { id: string; label: string; ariaLabel?: string; to?: RouteLocationRaw; rightAligned?: boolean }">
// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';

// ── Local Framework
import { TAB_CLASSES, TAB_SELECTED_CLASSES, TAB_UNSELECTED_CLASSES } from '@/components/ui/action/action';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ScrollRow from '@/components/ui/scroll/ScrollRow.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { activeId, isBorderless, items = [] } = defineProps<{
    activeId?: string;
    isBorderless?: boolean; // Leaves out the line under the bar, for a host that draws its own below more content.
    items?: T[];
}>();

defineSlots<{ default?(properties: { item: T }): unknown }>();

defineEmits<{ select: [item: T] }>();
</script>

<template>
    <!-- Links in a 'nav' rather than ARIA tabs, because each item opens its own URL. The caller names the 'nav' with
         'aria-label'. '-mt-1.5' pulls the bar up into the empty space at the bottom of the header above it. Each tab pads its
         label by 6px for its hover fill, so the tabs need no gap, and the first is pulled back to the page edge. -->
    <nav class="-mt-1.5 flex-none" data-region="TabBar">
        <ScrollRow :is-borderless="isBorderless" keep-active-item-in-view row-class="items-center gap-x-px">
            <ActionWrapper
                v-for="item in items"
                :key="item.id"
                :aria-current="activeId === item.id ? 'page' : undefined"
                :aria-label="item.ariaLabel"
                class="py-1.5 first:-ml-1.5"
                :class="[TAB_CLASSES, activeId === item.id ? TAB_SELECTED_CLASSES : TAB_UNSELECTED_CLASSES, item.rightAligned ? 'ml-auto' : '']"
                :to="item.to"
                @click="$emit('select', item)"
            >
                <slot :item="item">
                    <div v-if="item.label" class="text-sm">{{ item.label }}</div>
                </slot>
            </ActionWrapper>
        </ScrollRow>
    </nav>
</template>
