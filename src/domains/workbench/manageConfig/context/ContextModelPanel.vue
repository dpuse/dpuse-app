<script setup lang="ts">
// ── External Dependencies & Registrations
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ComponentBase } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework

// ── Local Components - Static
import type { GridListItem } from './ContextList.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { modelReference } = defineProps<{ modelReference: GridListItem<LocalisedConfig<ComponentBase>> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

const activeModelTab = ref({ id: 'entities', label: 'Entities', to: 'entities' });
const modelTabs = [
    { id: 'details', label: 'Details', to: 'details' },
    { id: 'entities', label: 'Entities', to: 'entities' },
    { id: 'secondaryMeasures', label: 'Measures', to: 'Measures' }
];
</script>

<template>
    <div class="dpuse-prose flex flex-1 flex-col px-4">
        <!-- Header -->
        <h3 class="flex-none pt-3">{{ modelReference.label }} Model</h3>

        <!-- Task Bar -->
        <div class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
            <template v-for="modelTab in modelTabs" :key="modelTab.id">
                <Button
                    class="border-y-2 border-t-transparent py-1.25"
                    :class="modelTab.id === activeModelTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                    shape="minimal"
                    :to="{ name: modelTab.to, query: { ...$route.query, wbView: modelTab.to } }"
                    @click="activeModelTab = modelTab"
                >
                    <div>{{ modelTab.label }}</div>
                </Button>
            </template>
        </div>

        <!-- Body -->
        <div class="flex-1 pt-2">Placeholder...</div>
    </div>
</template>
