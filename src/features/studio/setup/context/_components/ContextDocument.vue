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

defineEmits<{ edit: [item: T] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const expandedItemId = ref<string>(); // Held here rather than per disclosure, because only one item is open at a time.

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleToggleItem(itemId: string): void {
    expandedItemId.value = expandedItemId.value === itemId ? undefined : itemId;
}
</script>

<template>
    <div class="mt-6 mb-4 flex items-center justify-between gap-x-3 border-t border-separator pt-2">
        <!-- The prose heading's rule and spacing move to this row so the actions align with the title; '!' is needed
             because the unlayered '.dpuse-prose h2' rules otherwise beat Tailwind's utilities. -->
        <h2 class="m-0! border-t-0! p-0!">{{ title }}</h2>
        <slot name="titleActions" />
    </div>

    <p>{{ description }}</p>

    <ContextDisclosure
        v-for="item in items"
        :key="item.id"
        :description="item.description"
        :is-expanded="expandedItemId === item.id"
        :label="item.label"
        @edit="$emit('edit', item)"
        @toggle="handleToggleItem(item.id)"
    >
        <template #actions>
            <slot name="itemActions" :item="item" />
        </template>

        <slot :item="item" />
    </ContextDisclosure>
</template>
