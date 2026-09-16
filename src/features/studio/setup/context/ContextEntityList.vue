<script setup lang="ts">
// ── External Dependencies & Registrations
import { NetworkIcon } from '@lucide/vue';
import { shallowRef } from 'vue';

// ── Local Framework
import type { LocalisedEntity } from './_context';
import { T } from './ContextEntityList_.json';
import { t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ContextDocument from './_components/ContextDocument.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENTITY_TABS = [
    { id: 'parents', label: 'Parents' },
    { id: 'dataItems', label: 'Data Items' },
    { id: 'events', label: 'Events' },
    { id: 'primaryMeasures', label: 'Measures' }
];

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { entities } = defineProps<{ entities: LocalisedEntity[] }>();

defineEmits<{ edit: []; showErdDiagram: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const expandedEntityTab = shallowRef(ENTITY_TABS[0]); // Shared by every entity, so the same tab stays selected as they are opened in turn.
</script>

<template>
    <ContextDocument :description="t(T, 'entities.text')" :items="entities" :title="t(T, 'entities.title')" @edit="$emit('edit')">
        <template #titleActions>
            <ActionWrapper class="mr-4" @click="$emit('showErdDiagram')">
                <NetworkIcon class="size-5" stroke-width="1.5" />
            </ActionWrapper>
        </template>

        <template #default="{ item: entity }">
            <!-- Entity Tabs -->
            <div class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                <template v-for="entityTab in ENTITY_TABS" :key="entityTab.id">
                    <ActionWrapper
                        class="border-y-2 border-t-transparent py-1.25"
                        :class="entityTab.id === expandedEntityTab.id ? 'border-b-blue-400' : 'border-b-transparent'"
                        @click="expandedEntityTab = entityTab"
                    >
                        <div>{{ entityTab.label }}</div>
                    </ActionWrapper>
                </template>
            </div>

            <!-- Parents Panel -->
            <div v-show="expandedEntityTab.id === 'parents'" class="py-1">
                <div v-for="parent in entity.parents ?? []" :key="parent.entityTypeId">{{ parent.entityTypeId }}</div>
            </div>

            <!-- Data Items Panel -->
            <div v-show="expandedEntityTab.id === 'dataItems'" class="py-1">
                <div v-for="dataItem in entity.dataItems" :key="dataItem.id">{{ dataItem.label }}</div>
            </div>

            <!-- Events Panel -->
            <div v-show="expandedEntityTab.id === 'events'" class="py-1">
                <div v-for="event in entity.events" :key="event.id">{{ event.labelAction }}</div>
            </div>

            <!-- Primary Measures Panel -->
            <div v-show="expandedEntityTab.id === 'primaryMeasures'" class="py-1">
                <div v-for="primaryMeasure in entity.primaryMeasures" :key="primaryMeasure.id">{{ primaryMeasure.label }}</div>
            </div>
        </template>
    </ContextDocument>
</template>
