<script setup lang="ts">
// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { ChevronRightIcon, LoaderCircleIcon, NetworkIcon, SquarePenIcon } from '@lucide/vue';
import { defineAsyncComponent, onErrorCaptured, onMounted, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBase } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { MarkedTool as MarkedToolType } from '@dpuse/dpuse-tool-marked-markdown-parser';

// ── Local Framework
import { toolConfigs } from '@/state/session';

// ── Local Components - Static
import type { GridListItem } from './ContextList.vue';

// ── Data
import modelConfigs from './modelConfigs.json';

// ── Local Components - Static
import BaseDialog from '@/components/ui/dialog/BaseDialog.vue';
import Button from '@/components/ui/button/Button.vue';
import ComponentLoadError from '@/components/ui/ComponentLoadError.vue';

// ── Local Components - Dynamic
const ContextModelDescriptorsPanel = defineAsyncComponent(() => import('./ContextModelDescriptorsPanel.vue'));
const ContextErdDiagramPanel = defineAsyncComponent(() => import('./ContextErdDiagramPanel.vue'));
const ContextDimensionTreeDiagramPanel = defineAsyncComponent(() => import('./ContextDimensionTreeDiagramPanel.vue'));

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type Dimension = { id: string; label: Record<string, string>; description: Record<string, string> };
type Entity = { id: string; label: Record<string, string>; description: Record<string, string> };
type SecondaryMeasure = { id: string; label: Record<string, string>; description: Record<string, string>; formula: string };
type Model = { entities: Entity[]; dimensions: Dimension[]; secondaryMeasures: SecondaryMeasure[] };

type LocalisedDimensions = { id: string; label: string; description: string };
type LocalisedEntity = { id: string; label: string; description: string };
type LocalisedSecondaryMeasure = { id: string; label: string; description: string; formula: string };
type LocalisedModel = { entities: LocalisedEntity[]; dimensions: LocalisedDimensions[]; secondaryMeasures: LocalisedSecondaryMeasure[] };

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENTITY_TABS = [
    { id: 'parents', label: 'Parents' },
    { id: 'characteristics', label: 'Characteristics' },
    { id: 'events', label: 'Events' },
    { id: 'primaryMeasures', label: 'Measures' }
];

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { modelReference } = defineProps<{ modelReference: GridListItem<LocalisedConfig<ComponentBase>> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeModel = shallowRef();
const activeEntityTab = shallowRef(ENTITY_TABS[0]);
const expandedDimensionId = ref<string | null>(null);
const expandedEntityId = ref<string | null>(null);

const expandedSecondaryMeasureId = ref<string | null>(null);
const open = ref(false);
const erdDialogOpen = ref(false);
const dimensionTreeDialogOpen = ref(false);
const purifiedDescription = ref('');
const modelDescription = ref('');
const modelReferenceLabel = ref('');
const modelMap = modelConfigs as Record<string, Model>;
const markedTool = shallowRef<MarkedToolType>();
const descriptorsPanelError = ref<unknown>(null);
const erdPanelError = ref<unknown>(null);
const dimensionTreeDiagramPanelError = ref<unknown>(null);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onErrorCaptured((error) => {
    descriptorsPanelError.value = error;
    return false;
});

onErrorCaptured((error) => {
    erdPanelError.value = error;
    return false;
});

onErrorCaptured((error) => {
    dimensionTreeDiagramPanelError.value = error;
    return false;
});

const toolReady = new Promise<void>((resolve) => {
    watch(
        toolConfigs,
        (newToolConfigs) => {
            if (newToolConfigs.length === 0) return;
            resolve();
        },
        { immediate: true }
    );
});

onMounted(async () => {
    await toolReady;

    markedTool.value = await loadMarkedTool();
});

watch(
    () => modelReference,
    async (newModelReference) => {
        modelDescription.value = newModelReference.description + newModelReference.description + newModelReference.description + newModelReference.description;
        modelReferenceLabel.value = newModelReference.label;
        activeModel.value = localiseModel(modelMap[newModelReference.id]);

        markedTool.value ??= await loadMarkedTool();
        purifiedDescription.value = DOMPurify.sanitize(markedTool.value.render(newModelReference.description));
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function toggleDimension(dimensionId: string): void {
    expandedDimensionId.value = expandedDimensionId.value === dimensionId ? null : dimensionId;
}

function toggleEntity(entityId: string): void {
    expandedEntityId.value = expandedEntityId.value === entityId ? null : entityId;
}

function toggleSecondaryMeasure(secondaryMeasureId: string): void {
    expandedSecondaryMeasureId.value = expandedSecondaryMeasureId.value === secondaryMeasureId ? null : secondaryMeasureId;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function localiseModel(model: Model): LocalisedModel {
    const localisedEntities: LocalisedEntity[] = Array.from(model.entities, (entity) => ({ ...entity, label: entity.label.en, description: entity.description.en }));
    const localisedDimensions: LocalisedEntity[] = Array.from(model.dimensions, (dimension) => ({
        ...dimension,
        label: dimension.label.en,
        description: dimension.description.en
    }));
    const localisedSecondaryMeasures: LocalisedSecondaryMeasure[] = Array.from(model.secondaryMeasures, (measure) => ({
        ...measure,
        label: measure.label.en,
        description: measure.description.en
    }));
    return { ...model, entities: localisedEntities, dimensions: localisedDimensions, secondaryMeasures: localisedSecondaryMeasures };
}

function purifyText(text: string): string {
    if (!markedTool.value) return '';
    return DOMPurify.sanitize(markedTool.value.render(text));
}

async function loadMarkedTool(): Promise<MarkedToolType> {
    const toolModuleConfig = toolConfigs.value.find((config) => config.id === 'dpuse-tool-marked-markdown-parser');
    if (!toolModuleConfig) throw new Error('No Marked tool module configuration.');

    const url = `https://engine-eu.dpuse.app/tools/marked-markdown-parser_v${toolModuleConfig.version}/dpuse-tool-marked-markdown-parser.es.js`;
    const module = (await import(/* @vite-ignore */ url)) as { MarkedTool: new () => MarkedToolType };
    const MarkedTool = module.MarkedTool;
    return new MarkedTool();
}
</script>

<template>
    <div class="dpuse-prose flex-1 overflow-y-auto overscroll-y-none px-4 pb-(--vertical-scroll-bottom-screen-inset)">
        <div class="max-w-prose">
            <!-- Header -->
            <h1 class="flex flex-none items-center justify-between gap-x-3 pt-6">
                {{ modelReference.label }} Model
                <Button class="mr-4" shape="minimal" @click="open = true">
                    <SquarePenIcon class="size-5" stroke-width="1.5" />
                </Button>
            </h1>

            <!-- Description -->
            <div v-html="purifiedDescription" />

            <BaseDialog v-model="open" :title="`${modelReference.label} Descriptors`" @save="open = false">
                <ComponentLoadError v-if="descriptorsPanelError" :error="descriptorsPanelError" name="ContextModelDescriptorsPanel" class="flex-1" />
                <Suspense v-else-if="open">
                    <template #default>
                        <ContextModelDescriptorsPanel v-model:label="modelReferenceLabel" v-model:description="modelDescription" />
                    </template>
                    <template #fallback>
                        <div class="flex flex-1 items-center justify-center">
                            <LoaderCircleIcon class="animate-spin text-muted" />
                        </div>
                    </template>
                </Suspense>
            </BaseDialog>

            <!-- Entities -->
            <h2 class="flex flex-none items-center justify-between gap-x-3">
                Entities
                <Button class="mr-4" shape="minimal" @click="erdDialogOpen = true">
                    <NetworkIcon class="size-5" stroke-width="1.5" />
                </Button>
            </h2>

            <BaseDialog v-model="erdDialogOpen" title="Sample ERD Diagram" @save="erdDialogOpen = false">
                <ComponentLoadError v-if="erdPanelError" :error="erdPanelError" name="ContextErdDiagramPanel" class="flex-1" />
                <Suspense v-else-if="erdDialogOpen">
                    <template #default>
                        <ContextErdDiagramPanel />
                    </template>
                    <template #fallback>
                        <div class="flex flex-1 items-center justify-center">
                            <LoaderCircleIcon class="animate-spin text-muted" />
                        </div>
                    </template>
                </Suspense>
            </BaseDialog>

            <p>The entities that make up this model.</p>

            <div
                v-for="entity in activeModel.entities"
                :key="entity.id"
                class="mt-2 max-w-prose border"
                :class="expandedEntityId === entity.id ? 'rounded-md  border-separator' : 'rounded-md border-backdrop'"
            >
                <div
                    role="button"
                    tabindex="0"
                    :aria-expanded="expandedEntityId === entity.id"
                    class="flex items-center gap-x-2 bg-backdrop py-2 pr-4 pl-2"
                    :class="expandedEntityId === entity.id ? 'rounded-t-md' : 'rounded-md'"
                    @click="toggleEntity(entity.id)"
                    @keydown.enter="toggleEntity(entity.id)"
                    @keydown.space.prevent="toggleEntity(entity.id)"
                >
                    <ChevronRightIcon class="size-5" stroke-width="1.5" />
                    <div class="flex-1">{{ entity.label }}</div>
                    <Button shape="minimal" @click="open = true">
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

            <!-- Dimensions -->
            <h2 class="flex flex-none items-center justify-between gap-x-3">Dimensions</h2>

            <BaseDialog v-model="dimensionTreeDialogOpen" title="Sample Dimension Tree Diagram" @save="dimensionTreeDialogOpen = false">
                <ComponentLoadError v-if="dimensionTreeDiagramPanelError" :error="dimensionTreeDiagramPanelError" name="ContextDimensionTreeDiagramPanel" class="flex-1" />
                <Suspense v-else-if="dimensionTreeDialogOpen">
                    <template #default>
                        <ContextDimensionTreeDiagramPanel />
                    </template>
                    <template #fallback>
                        <div class="flex flex-1 items-center justify-center">
                            <LoaderCircleIcon class="animate-spin text-muted" />
                        </div>
                    </template>
                </Suspense>
            </BaseDialog>

            <p>The dimensions ... this model.</p>

            <div
                v-for="dimension in activeModel.dimensions"
                :key="dimension.id"
                class="mt-2 max-w-prose border"
                :class="expandedDimensionId === dimension.id ? 'rounded-md  border-separator' : 'rounded-md border-backdrop'"
            >
                <div
                    role="button"
                    tabindex="0"
                    :aria-expanded="expandedDimensionId === dimension.id"
                    class="flex items-center gap-x-2 bg-backdrop py-2 pr-4 pl-2"
                    :class="expandedDimensionId === dimension.id ? 'rounded-t-md' : 'rounded-md'"
                    @click="toggleDimension(dimension.id)"
                    @keydown.enter="toggleDimension(dimension.id)"
                    @keydown.space.prevent="toggleDimension(dimension.id)"
                >
                    <ChevronRightIcon class="size-5" stroke-width="1.5" />
                    <div class="flex-1">{{ dimension.label }}</div>
                    <Button class="mr-1" shape="minimal" @click="dimensionTreeDialogOpen = true">
                        <NetworkIcon class="size-5" stroke-width="1.5" />
                    </Button>
                    <Button shape="minimal" @click="open = true">
                        <SquarePenIcon class="size-5" stroke-width="1.5" />
                    </Button>
                </div>

                <div v-if="expandedDimensionId === dimension.id" class="overflow-y-hidden rounded-b-md px-4 pb-4">
                    <!-- Description -->
                    <div v-html="purifyText(dimension.description)" />

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
                        <div v-for="parent in dimension.parents" :key="parent">
                            {{ parent }}
                        </div>
                    </div>

                    <!-- Characteristics Panel -->
                    <div v-show="activeEntityTab.id === 'characteristics'" class="py-1">
                        <div v-for="characteristic in dimension.characteristics" :key="characteristic">
                            {{ characteristic }}
                        </div>
                    </div>

                    <!-- Events Panel -->
                    <div v-show="activeEntityTab.id === 'events'" class="py-1">
                        <!-- <div v-for="event in entity.events" :key="event.id">{{ event.id }}</div> -->
                        {{ dimension.events }}
                    </div>

                    <!-- Primary Measures Panel -->
                    <div v-show="activeEntityTab.id === 'primaryMeasures'" class="py-1">
                        <!-- <div v-for="primaryMeasure in entity.primaryMeasures" :key="primaryMeasure.id">{{ primaryMeasure.id }}</div> -->
                        {{ dimension.primaryMeasures }}
                    </div>
                </div>
            </div>

            <!-- Secondary Measures -->
            <h2 class="flex flex-none items-center justify-between gap-x-3">Secondary Measures</h2>

            <p>The measures ... this model.</p>

            <div
                v-for="measure in activeModel.secondaryMeasures"
                :key="measure.id"
                class="mt-2 max-w-prose border"
                :class="expandedSecondaryMeasureId === measure.id ? 'rounded-md  border-separator' : 'rounded-md border-backdrop'"
            >
                <div
                    role="button"
                    tabindex="0"
                    :aria-expanded="expandedSecondaryMeasureId === measure.id"
                    class="flex items-center gap-x-2 bg-backdrop py-2 pr-4 pl-2"
                    :class="expandedSecondaryMeasureId === measure.id ? 'rounded-t-md' : 'rounded-md'"
                    @click="toggleSecondaryMeasure(measure.id)"
                    @keydown.enter="toggleSecondaryMeasure(measure.id)"
                    @keydown.space.prevent="toggleSecondaryMeasure(measure.id)"
                >
                    <ChevronRightIcon class="size-5" stroke-width="1.5" />
                    <div class="flex-1">{{ measure.label }}</div>
                    <Button shape="minimal" @click="open = true">
                        <SquarePenIcon class="size-5" stroke-width="1.5" />
                    </Button>
                </div>

                <div v-if="expandedSecondaryMeasureId === measure.id" class="overflow-y-hidden rounded-b-md px-4 pb-4">
                    <!-- Description -->
                    <div v-html="purifyText(measure.description)" />

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
                        <div v-for="parent in measure.parents" :key="parent">
                            {{ parent }}
                        </div>
                    </div>

                    <!-- Characteristics Panel -->
                    <div v-show="activeEntityTab.id === 'characteristics'" class="py-1">
                        <div v-for="characteristic in measure.characteristics" :key="characteristic">
                            {{ characteristic }}
                        </div>
                    </div>

                    <!-- Events Panel -->
                    <div v-show="activeEntityTab.id === 'events'" class="py-1">
                        <!-- <div v-for="event in entity.events" :key="event.id">{{ event.id }}</div> -->
                        {{ measure.events }}
                    </div>

                    <!-- Primary Measures Panel -->
                    <div v-show="activeEntityTab.id === 'primaryMeasures'" class="py-1">
                        <!-- <div v-for="primaryMeasure in entity.primaryMeasures" :key="primaryMeasure.id">{{ primaryMeasure.id }}</div> -->
                        {{ measure.primaryMeasures }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
