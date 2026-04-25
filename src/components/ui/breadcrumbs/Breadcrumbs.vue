<script setup lang="ts">
// Types
export interface Breadcrumb {
    id: string;
    label: string;
    to?: string;
}

// Properties, Slots & Emits
const { items } = defineProps<{ items?: Breadcrumb[] }>();
</script>

<template>
    <div v-if="items">
        <!-- TODO: Is there enough room around breadcrumbs to effectively tap on touch devices? -->
        <component
            :is="item.to ? 'RouterLink' : 'div'"
            v-for="(item, index) in items"
            :key="item.id"
            :to="{ name: item.to, query: { ...$route.query, wbView: item.to } }"
            class="w-full truncate"
        >
            <span v-if="index > 0" class="mx-1">&gt;</span>{{ item.label }}
        </component>
    </div>
</template>
