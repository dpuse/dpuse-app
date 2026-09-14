<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBaseConfig } from '@dpuse/dpuse-shared/component';
import { type LocalisedConfig, localiseReference } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import type { SetupOptionConfig } from '@/utilities/index.ts';
import { T } from './ContextModelList_.json';
import { useSetupRoute } from '../useSetupRoute';
import { contextConfig, contextConfigRetrievalFailed, contextConfigRetrievalFailure, contextConfigRetrievalSucceeded } from '@/state/session';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ContextModelPanel from './ContextModelPanel.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type GridListItem<T> = T & { isHeader?: boolean };

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineProps<{ setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { routeId, setRouteId } = useSetupRoute();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const modelReferenceActive = computed(() =>
    routeId.value === undefined ? undefined : modelReferencesByArea.value.find((model) => model.isHeader !== true && model.id === routeId.value)
);
const modelReferencesByArea = computed<GridListItem<LocalisedConfig<ComponentBaseConfig>>[]>(() => {
    const items: GridListItem<LocalisedConfig<ComponentBaseConfig>>[] = [];
    const areaReferences = contextConfig.value?.areas ?? [];
    for (const areaReference of areaReferences) {
        const areaReferenceLocalised = localiseReference(areaReference, localeId.value);
        items.push({ ...areaReferenceLocalised, isHeader: true });
        for (const modelReference of areaReference.models) {
            const modelReferenceLocalised = localiseReference(modelReference, localeId.value);
            items.push({ ...modelReferenceLocalised, isHeader: false });
        }
    }
    return items;
});
const modelReferencesByAreaDataSource = computed<DataSource<GridListItem<LocalisedConfig<ComponentBaseConfig>>>>(() => ({
    rowCount: contextConfigRetrievalSucceeded.value || contextConfigRetrievalFailed.value ? modelReferencesByArea.value.length : undefined, // Set count on success or failure, not pending.
    rows: modelReferencesByArea.value
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    modelReferencesByArea,
    (newModelReferencesByArea) => {
        if (routeId.value === undefined) return; // Exit if no model identifier in url.
        if (newModelReferencesByArea.some((model) => model.isHeader !== true && model.id === routeId.value)) return; // Exit if valid model identifier in url.
        if (contextConfigRetrievalSucceeded.value || contextConfigRetrievalFailed.value) setRouteId(undefined); // Only clear invalid model identifier from url once retrieval is finalised.
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectModel(modelReference: GridListItem<LocalisedConfig<ComponentBaseConfig>> | undefined): void {
    setRouteId(modelReference?.id);
}
</script>

<template>
    <ErrorNotice v-if="contextConfigRetrievalFailure" covers-region :can-retry="false" :failures="[contextConfigRetrievalFailure]" />

    <GridDetailPanel v-else :active-item="modelReferenceActive" class="min-h-0 flex-1" :data-source="modelReferencesByAreaDataSource" :is-compact="true" max-grid-width="350px">
        <template #item="{ item }">
            <div v-if="item.isHeader" class="flex h-full items-end pl-2 text-left text-xs font-semibold text-muted uppercase">{{ item.label }}</div>
            <ConfigCard v-else :is-compact="true" :config="item" @click="handleSelectModel(item)" />
        </template>

        <template #detail="{ item }">
            <ContextModelPanel :model-reference="item" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(T, 'selectFocus.text')" />
        </template>
    </GridDetailPanel>
</template>
