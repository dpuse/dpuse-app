<script setup lang="ts">
// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { PencilIcon, SquarePenIcon } from '@lucide/vue';
import { ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBase } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Components - Static
import type { GridListItem } from './ContextList.vue';

// ── Data
import modelConfigs from './modelConfigs.json';

// ── Local Components - Static
import BaseDialog from '@/components/ui/dialog/BaseDialog.vue';
import Button from '@/components/ui/button/Button.vue';
import Input from '@/components/ui/Input.vue';
import TextEditor from '@/components/ui/TextEditor.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type Model = { entities: { id: string; label: string }[] };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENTITY_TABS = [
    { id: 'parents', label: 'Parents' },
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
const open = ref(false);
const purifiedDescription = ref('');
const modelDescription = ref('');
const modelReferenceLabel = ref('');
const modelMap = modelConfigs as Record<string, Model>;

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => modelReference,
    (newModelReference) => {
        purifiedDescription.value = DOMPurify.sanitize(marked.parse(newModelReference.description, { async: false }));
        modelDescription.value = newModelReference.description;
        modelReferenceLabel.value = newModelReference.label;
        activeModel.value = localiseModel(modelMap[newModelReference.id]);
    },
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
        <div class="flex flex-none items-center gap-x-3 pt-3">
            <h1 class="">{{ modelReference.label }} Model</h1>
            <Button class="" shape="minimal" @click="open = true">
                <SquarePenIcon class="size-5" />
            </Button>
        </div>

        <!-- Description -->
        <div v-html="purifiedDescription" />

        <BaseDialog v-model="open" :title="`${modelReference.label} Descriptors`" @save="open = false">
            <Input v-model="modelReferenceLabel" label="Label" />
            <TextEditor v-model="modelDescription" label="Description" />
        </BaseDialog>

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
                <!-- Description -->
                <p>{{ entity.description }}</p>

                <!-- Entity Tabs -->
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

                <!-- Parents Panel -->
                <div v-show="activeEntityTab.id === 'parents'" class="py-1">
                    <div v-for="parent in entity.parents" :key="parent">
                        {{ parent }}
                    </div>
                </div>

                <!-- Characteristics Panel -->
                <div v-show="activeEntityTab.id === 'characteristics'" class="py-1">
                    <div v-for="characteristic in entity.characteristics" :key="characteristic">
                        {{ characteristic }}
                    </div>
                </div>

                <!-- Events Panel -->
                <div v-show="activeEntityTab.id === 'events'" class="py-1">
                    <!-- <div v-for="event in entity.events" :key="event.id">{{ event.id }}</div> -->
                    {{ entity.events }}
                </div>

                <!-- Primary Measures Panel -->
                <div v-show="activeEntityTab.id === 'primaryMeasures'" class="py-1">
                    <!-- <div v-for="primaryMeasure in entity.primaryMeasures" :key="primaryMeasure.id">{{ primaryMeasure.id }}</div> -->
                    {{ entity.primaryMeasures }}
                </div>
            </div>
        </div>

        <!-- Secondary Measures -->
        <h2>Secondary Measures</h2>
        <p>Something about secondary measures...</p>
    </div>
</template>
