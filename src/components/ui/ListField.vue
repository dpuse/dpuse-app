<script setup lang="ts" generic="T extends { id: string; label: string }">
// ── External Dependencies
import { useId } from 'vue';

// ── Local Components - Static
import ListItemButton from './button/ListItemButton.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { items, label } = defineProps<{ items?: T[]; label?: string }>();

defineEmits<{ select: [item: T] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const id = useId();
</script>

<template>
    <div data-region="ListField">
        <!-- Label -->
        <label v-if="label" :for="id" class="mb-1 block border-b border-separator pb-1 text-xs font-medium text-muted">{{ label }}</label>

        <!-- List -->
        <div class="flex flex-col gap-y-1">
            <ListItemButton v-for="item in items" :key="item.id" @click="$emit('select', item)">
                {{ item.label }}
            </ListItemButton>
        </div>
    </div>
</template>
