<script setup lang="ts" generic="T extends { description: string; id: string; label: string }">
// ── External Dependencies & Registrations
import { ref } from 'vue';

// ── Static Components
import ContextDisclosure from './ContextDisclosure.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { description, items, title } = defineProps<{ description: string; items: T[]; title: string }>();

defineSlots<{
    default(properties: { item: T }): unknown; // Rendered below each item's own description, inside the open disclosure.
    itemActions(properties: { item: T }): unknown;
    titleActions(): unknown;
}>();

defineEmits<{ edit: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const expandedItemId = ref<string | null>(null); // Held here rather than per disclosure, because only one item is open at a time.

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleToggleItem(itemId: string): void {
    expandedItemId.value = expandedItemId.value === itemId ? null : itemId;
}
</script>

<template>
    <h2 class="flex flex-none items-center justify-between gap-x-3">
        {{ title }}
        <slot name="titleActions" />
    </h2>

    <p>{{ description }}</p>

    <ContextDisclosure
        v-for="item in items"
        :key="item.id"
        :description="item.description"
        :is-expanded="expandedItemId === item.id"
        :label="item.label"
        @edit="$emit('edit')"
        @toggle="handleToggleItem(item.id)"
    >
        <template #actions>
            <slot name="itemActions" :item="item" />
        </template>

        <slot :item="item" />
    </ContextDisclosure>
</template>
