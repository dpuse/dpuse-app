<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronRightIcon, NetworkIcon, SquarePenIcon } from '@lucide/vue';
import { ref, shallowRef } from 'vue';

// ── DPUse Framework
import type { Tool as MarkedTool } from '@dpuse/dpuse-tool-marked-markdown-parser';

// ── Local Framework
import type { LocalisedEntity } from './contextModel';
import { purifyMarkdown } from '@/services/useMarkedTool';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENTITY_TABS = [
    { id: 'parents', label: 'Parents' },
    { id: 'dataItems', label: 'Data Items' },
    { id: 'events', label: 'Events' },
    { id: 'primaryMeasures', label: 'Measures' }
];

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    entities: LocalisedEntity[];
    markedTool: MarkedTool | undefined;
}
const { entities, markedTool } = defineProps<Properties>();

defineEmits<{ edit: []; showErdDiagram: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeTab = shallowRef(ENTITY_TABS[0]);
const expandedEntityId = ref<string | null>(null);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleToggleEntity(entityId: string): void {
    expandedEntityId.value = expandedEntityId.value === entityId ? null : entityId;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function purifyText(text: string): string {
    return purifyMarkdown(markedTool, text);
}
</script>

<template>
    <h2 class="flex flex-none items-center justify-between gap-x-3">
        Entities
        <ActionWrapper class="mr-4" @click="$emit('showErdDiagram')">
            <NetworkIcon class="size-5" stroke-width="1.5" />
        </ActionWrapper>
    </h2>

    <p>The entities that make up this model.</p>

    <div
        v-for="entity in entities"
        :key="entity.id"
        class="mt-2 max-w-prose border"
        :class="expandedEntityId === entity.id ? 'rounded-md border-separator' : 'rounded-md border-backdrop'"
    >
        <div
            role="button"
            tabindex="0"
            :aria-expanded="expandedEntityId === entity.id"
            class="flex items-center gap-x-2 bg-backdrop py-2 pr-4 pl-2"
            :class="expandedEntityId === entity.id ? 'rounded-t-md' : 'rounded-md'"
            @click="handleToggleEntity(entity.id)"
            @keydown.enter="handleToggleEntity(entity.id)"
            @keydown.space.prevent="handleToggleEntity(entity.id)"
        >
            <ChevronRightIcon class="size-5" stroke-width="1.5" />
            <div class="flex-1">{{ entity.label }}</div>
            <ActionWrapper @click="$emit('edit')">
                <SquarePenIcon class="size-5" stroke-width="1.5" />
            </ActionWrapper>
        </div>

        <div v-if="expandedEntityId === entity.id" class="overflow-y-hidden rounded-b-md px-4 pb-4">
            <!-- Description -->
            <div v-html="purifyText(entity.description)" />

            <!-- Entity Tabs -->
            <div class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                <template v-for="entityTab in ENTITY_TABS" :key="entityTab.id">
                    <ActionWrapper
                        class="border-y-2 border-t-transparent py-1.25"
                        :class="entityTab.id === activeTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                        @click="activeTab = entityTab"
                    >
                        <div>{{ entityTab.label }}</div>
                    </ActionWrapper>
                </template>
            </div>

            <!-- Parents Panel -->
            <div v-show="activeTab.id === 'parents'" class="py-1">
                <div v-for="parent in entity.parents ?? []" :key="parent">{{ parent }}</div>
            </div>

            <!-- Data Items Panel -->
            <div v-show="activeTab.id === 'dataItems'" class="py-1">
                <div v-for="dataItem in entity.dataItems" :key="dataItem.id">{{ dataItem.label }}</div>
            </div>

            <!-- Events Panel -->
            <div v-show="activeTab.id === 'events'" class="py-1">
                <div v-for="event in entity.events" :key="event.id">{{ event.labelAction }}</div>
            </div>

            <!-- Primary Measures Panel -->
            <div v-show="activeTab.id === 'primaryMeasures'" class="py-1">
                <div v-for="primaryMeasure in entity.primaryMeasures" :key="primaryMeasure.id">{{ primaryMeasure.label }}</div>
            </div>
        </div>
    </div>
</template>
