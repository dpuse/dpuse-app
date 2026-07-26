<script setup lang="ts">
// ── External Dependencies & Registrations
import { ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBase } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Components - Static
import type { GridListItem } from './ContextList.vue';

// ── Data
import modelConfigs from './modelConfigs.json';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type Model = { entities: { id: string; label: string }[] };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENTITY_TABS = [
    { id: 'characteristics', label: 'Characteristics' },
    { id: 'events', label: 'Events' },
    { id: 'primaryMeasures', label: 'Measures' }
];

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { modelReference } = defineProps<{ modelReference: GridListItem<LocalisedConfig<ComponentBase>> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeModel = shallowRef();
const activeEntityTab = shallowRef(ENTITY_TABS[0]);
const expandedEntityId = ref<string | null>(null);

// const activeModelTab = ref(MODEL_TABS[0]);
const modelMap = modelConfigs as Record<string, Model>;

watch(
    () => modelReference,
    (newModelReference) => (activeModel.value = localiseModel(modelMap[newModelReference.id])),
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function toggleEntity(entityId: string): void {
    expandedEntityId.value = expandedEntityId.value === entityId ? null : entityId;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function localiseModel(model: Model): Model {
    return model;
}
</script>

<template>
    <div class="dpuse-prose flex-1 overflow-y-auto overscroll-y-none px-4">
        <!-- Header -->
        <h1 class="flex-none pt-3">{{ modelReference.label }} Model</h1>

        <!-- Task Bar -->
        <!-- <div class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
            <template v-for="modelTab in MODEL_TABS" :key="modelTab.id">
                <! -- <Button
                    class="border-y-2 border-t-transparent py-1.25"
                    :class="modelTab.id === activeModelTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                    shape="minimal"
                    :to="{ name: modelTab.to, query: { ...$route.query, wbView: modelTab.to } }"
                    @click="activeModelTab = modelTab"
                >
                    <div>{{ modelTab.label }}</div>
                </Button> -- >
                <Button
                    class="border-y-2 border-t-transparent py-1.25"
                    :class="modelTab.id === activeModelTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                    shape="minimal"
                    @click="activeModelTab = modelTab"
                >
                    <div>{{ modelTab.label }}</div>
                </Button>
            </template>
        </div> -->

        <!-- Body -->
        <!-- <div v-if="activeModelTab.id === 'details'" class="flex-1 pt-2"></div>

        <div v-else-if="activeModelTab.id === 'entities'" class="flex-1 pt-2">
            <div v-for="entity in activeModel.entities ?? []" :key="entity.id">{{ entity.label }}</div>
        </div>

        <div v-else-if="activeModelTab.id === 'secondaryMeasures'" class="flex-1 pt-2">Measures...</div> -->

        <!-- Description -->
        <p v-for="(paragraph, index) in modelReference.description" :key="index">{{ paragraph }}</p>

        <!-- Dimensions -->
        <h2>Dimensions</h2>
        <p>Something about dimensions...</p>

        <!-- Entities -->
        <h2>Entities</h2>
        <p>Something about entities...</p>
        <div v-for="entity in activeModel.entities ?? []" :key="entity.id">
            <h4
                role="button"
                tabindex="0"
                :aria-expanded="expandedEntityId === entity.id"
                @click="toggleEntity(entity.id)"
                @keydown.enter="toggleEntity(entity.id)"
                @keydown.space.prevent="toggleEntity(entity.id)"
            >
                {{ entity.label }}
            </h4>
            <div v-if="expandedEntityId === entity.id" class="my-1 border-y border-separator">
                <div class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                    <template v-for="entityTab in ENTITY_TABS" :key="entityTab.id">
                        <Button
                            class="border-y-2 border-t-transparent py-1.25"
                            :class="entityTab.id === activeEntityTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                            shape="minimal"
                            @click="activeEntityTab = entityTab"
                        >
                            <div>{{ entityTab.label }}</div>
                        </Button>
                    </template>
                </div>

                <div v-show="activeEntityTab.id === 'characteristics'" class="py-1">
                    <div v-for="characteristic in entity.characteristics" :key="characteristic">{{ characteristic }}</div>
                </div>

                <div v-show="activeEntityTab.id === 'events'" class="py-1">
                    <div v-for="event in entity.events" :key="event.id">{{ event.id }}</div>
                </div>

                <div v-show="activeEntityTab.id === 'primaryMeasures'" class="py-1">
                    <div v-for="primaryMeasure in entity.primaryMeasures" :key="primaryMeasure.id">{{ primaryMeasure.id }}</div>
                </div>
            </div>
        </div>

        <!-- Secondary Measures -->
        <h2>Secondary Measures</h2>
        <p>Something about secondary measures...</p>
    </div>
</template>
