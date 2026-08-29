<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronRightIcon, NetworkIcon, SquarePenIcon } from '@lucide/vue';
import { ref, shallowRef } from 'vue';

// ── DPUse Framework
import type { Tool as MarkedTool } from '@dpuse/dpuse-tool-marked-markdown-parser';

// ── Local Framework
import type { LocalisedModelItem } from './contextModel';
import { purifyMarkdown } from '@/services/useMarkedTool';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENTITY_TABS = [
    { id: 'parents', label: 'Parents' },
    { id: 'characteristics', label: 'Characteristics' },
    { id: 'events', label: 'Events' },
    { id: 'primaryMeasures', label: 'Measures' }
];

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    entities: LocalisedModelItem[];
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
        <Button class="mr-4" shape="minimal" @click="$emit('showErdDiagram')">
            <NetworkIcon class="size-5" stroke-width="1.5" />
        </Button>
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
            <Button shape="minimal" @click="$emit('edit')">
                <SquarePenIcon class="size-5" stroke-width="1.5" />
            </Button>
        </div>

        <div v-if="expandedEntityId === entity.id" class="overflow-y-hidden rounded-b-md px-4 pb-4">
            <!-- Description -->
            <div v-html="purifyText(entity.description)" />

            <!-- Entity Tabs -->
            <div class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                <template v-for="entityTab in ENTITY_TABS" :key="entityTab.id">
                    <Button
                        class="border-y-2 border-t-transparent py-1.25"
                        :class="entityTab.id === activeTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                        shape="minimal"
                        @click="activeTab = entityTab"
                    >
                        <div>{{ entityTab.label }}</div>
                    </Button>
                </template>
            </div>

            <!-- Parents Panel -->
            <div v-show="activeTab.id === 'parents'" class="py-1">
                <div v-for="parent in entity.parents ?? []" :key="parent">{{ parent }}</div>
            </div>

            <!-- Characteristics Panel -->
            <div v-show="activeTab.id === 'characteristics'" class="py-1">
                <div v-for="characteristic in entity.characteristics ?? []" :key="characteristic">{{ characteristic }}</div>
            </div>

            <!-- Events Panel -->
            <div v-show="activeTab.id === 'events'" class="py-1">
                <div v-for="event in entity.events ?? []" :key="event">{{ event }}</div>
            </div>

            <!-- Primary Measures Panel -->
            <div v-show="activeTab.id === 'primaryMeasures'" class="py-1">
                <div v-for="primaryMeasure in entity.primaryMeasures ?? []" :key="primaryMeasure">{{ primaryMeasure }}</div>
            </div>
        </div>
    </div>
</template>
