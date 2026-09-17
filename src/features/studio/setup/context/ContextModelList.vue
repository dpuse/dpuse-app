<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { ComponentBaseConfig } from '@dpuse/dpuse-shared/component';
import { type LocalisedConfig, localiseReference } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { GridListItem } from './_context';
import { T } from './ContextModelList_.json';
import { useSetupSelection } from '../useSetupSelection';
import { contextConfig, contextConfigRetrievalFailed, contextConfigRetrievalFailure, contextConfigRetrievalSucceeded } from '@/state/session';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ContextModelPanel from './ContextModelPanel.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const modelReferencesByArea = computed<GridListItem<LocalisedConfig<ComponentBaseConfig>>[]>(() => {
    const items: GridListItem<LocalisedConfig<ComponentBaseConfig>>[] = [];
    const areaReferences = contextConfig.value?.areas ?? [];
    for (const areaReference of areaReferences) {
        items.push({ id: areaReference.id, isHeader: true, label: localiseReference(areaReference, localeId.value).label });
        for (const modelReference of areaReference.models) {
            const modelReferenceLocalised = localiseReference(modelReference, localeId.value);
            items.push({ ...modelReferenceLocalised, isHeader: false });
        }
    }
    return items;
});
const {
    activeItem: activeModelReference,
    dataSource: modelReferencesByAreaDataSource,
    selectItem
} = useSetupSelection(
    modelReferencesByArea,
    () => contextConfigRetrievalSucceeded.value || contextConfigRetrievalFailed.value,
    (item) => !item.isHeader
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectModel(modelReference: GridListItem<LocalisedConfig<ComponentBaseConfig>>): void {
    selectItem(modelReference);
}
</script>

<template>
    <ErrorNotice v-if="contextConfigRetrievalFailure" covers-region :can-retry="false" :failures="[contextConfigRetrievalFailure]" />

    <GridDetailPanel v-else :active-item="activeModelReference" class="min-h-0 flex-1" :data-source="modelReferencesByAreaDataSource" :is-compact="true" max-grid-width="350px">
        <template #item="{ item }">
            <div v-if="item.isHeader" class="flex h-full items-end pl-2 text-left text-xs font-bold text-muted uppercase">{{ item.label }}</div>
            <ConfigCard v-else :is-compact="true" :config="item" :selected="item.id === activeModelReference?.id" @click="handleSelectModel(item)" />
        </template>

        <template #detail="{ item, close }">
            <!-- Headers are never selectable, so 'v-if' always passes; it is here to narrow the row's type. Keyed so each model
                 starts from a fresh panel, rather than showing the previous model's content and open rows while it loads. -->
            <ContextModelPanel v-if="!item.isHeader" :key="item.id" :model-reference="item" @close="close" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(T, 'selectFocus.text')" />
        </template>
    </GridDetailPanel>
</template>
