<script setup lang="ts">
// External Dependencies
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Local Framework
import type { TabConfig } from '@/composables/useTabs';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { activeItemId, items } = defineProps<{ activeItemId?: string; items: TabConfig[] }>();
defineSlots<{ 'default'(properties: { item: TabConfig }): unknown }>();
const emit = defineEmits<{ select: [tab: TabConfig] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

const selectedItemId = ref('');

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const fallbackItemId = computed(() => {
    const routeTabId = typeof route.query.wbView === 'string' ? items.find((item) => item.to === route.query.wbView)?.id : undefined;
    return activeItemId ?? routeTabId ?? items[0]?.id ?? '';
});

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    fallbackItemId,
    (nextItemId) => {
        selectedItemId.value = nextItemId;
    },
    { immediate: true }
);

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function selectItem(item: TabConfig): void {
    selectedItemId.value = item.id;
    emit('select', item);
}

function selectDropdownItem(event: Event): void {
    const nextItemId = (event.target as HTMLSelectElement).value;
    const item = items.find((candidate) => candidate.id === nextItemId);
    if (item == null) return;

    selectItem(item);
    if (item.to != null) {
        router.push({ name: item.to, query: { ...route.query, wbView: item.to } });
    }
}
</script>

<template>
    <div class="flex h-full min-w-0 items-center">
        <!-- Render as selector on small screens. -->
        <select aria-label="Select tab" :value="selectedItemId" class="bg-surface text-content block h-9 w-full rounded-md text-sm sm:hidden" @change="selectDropdownItem">
            <option v-for="item in items" :key="item.id" :value="item.id">{{ item.label }}</option>
        </select>

        <!-- Render as tabs on medium, or larger, screens. -->
        <div class="hidden h-full items-stretch gap-x-4 sm:flex">
            <!-- TODO: Is there enough room around tabs to effectively tap on touch devices? -->
            <component
                :is="item.to ? 'RouterLink' : 'div'"
                v-for="item in items"
                :key="item.id"
                :to="item.to ? { name: item.to, query: { ...$route.query, wbView: item.to } } : undefined"
                class="-center flex h-full min-w-0 flex-col justify-center truncate border-y-2 border-t-transparent border-b-zinc-500 leading-tight"
                role="tab"
                @click="selectItem(item)"
            >
                <slot :item="item" />
            </component>
        </div>
    </div>
</template>
