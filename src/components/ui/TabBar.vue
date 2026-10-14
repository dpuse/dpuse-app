<script setup lang="ts" generic="T extends { id: string; label: string; ariaLabel?: string; to?: RouteLocationRaw; rightAligned?: boolean }">
// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ScrollRow from '@/components/ui/scroll/ScrollRow.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { activeId, items = [] } = defineProps<{ activeId?: string; items?: T[] }>();

defineSlots<{ default?(properties: { item: T }): unknown }>();

defineEmits<{ select: [item: T] }>();
</script>

<template>
    <!-- Links in a 'nav' rather than ARIA tabs, because each item opens its own URL. The caller names the 'nav' with
         'aria-label'. '-mt-1.5' pulls the bar up into the empty space at the bottom of the header above it. -->
    <nav class="-mt-1.5 flex-none" data-region="TabBar">
        <ScrollRow keep-active-item-in-view row-class="items-center gap-x-3">
            <ActionWrapper
                v-for="item in items"
                :key="item.id"
                :aria-current="activeId === item.id ? 'page' : undefined"
                :aria-label="item.ariaLabel"
                class="border-y-2 border-t-transparent py-1"
                :class="[activeId === item.id ? 'border-b-accent text-accent' : 'border-b-transparent', item.rightAligned ? 'ml-auto' : '']"
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
