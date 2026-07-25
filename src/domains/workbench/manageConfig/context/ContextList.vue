<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBase } from '@dpuse/dpuse-shared/component';
import type { ContextConfig } from '@dpuse/dpuse-shared/component/context';
import { localiseConfig, type LocalisedConfig, localiseReference } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';

// ── Local Components - Static
import Card from '@/components/ui/Card.vue';
import ContextModelPanel from './ContextModelPanel.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

// ── Date ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

import contextConfigData from './contextConfig.json';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type GridListItem<T> = T & { isHeader?: boolean };

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeModelReference = shallowRef<GridListItem<LocalisedConfig<ComponentBase>> | undefined>();
const contextConfig = shallowRef<ContextConfig>(contextConfigData as ContextConfig);

const contextLocalisedConfig = shallowRef<LocalisedConfig<ContextConfig>>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const modelReferencesDataSource = computed<DataSource<GridListItem<LocalisedConfig<ComponentBase>>>>(() => getModels());

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(contextConfig, (newContextConfig) => (contextLocalisedConfig.value = localiseConfig<ContextConfig>(newContextConfig, localeId.value)), {
    immediate: true
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSelectModel(modelReference: GridListItem<LocalisedConfig<ComponentBase>> | undefined): Promise<void> {
    activeModelReference.value = modelReference;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function getModels(): DataSource<GridListItem<LocalisedConfig<ComponentBase>>> {
    const localisedModels: GridListItem<LocalisedConfig<ComponentBase>>[] = [];
    for (const area of contextConfig.value.areas) {
        const la = localiseReference(area, localeId.value);
        localisedModels.push({ ...la, isHeader: true });
        for (const model of area.models) {
            const lr = localiseReference(model, localeId.value);
            localisedModels.push({ ...lr, isHeader: false });
        }
    }
    return {
        rowCount: localisedModels.length,
        rows: localisedModels
    };
}
</script>

<template>
    <GridDetailPanel
        :active-item="activeModelReference"
        class="min-h-0 flex-1"
        :data-source="modelReferencesDataSource"
        :is-compact="true"
        max-list-width="350px"
        @select="handleSelectModel($event)"
    >
        <template #grid-item="{ item }">
            <div v-if="item.isHeader" class="text-left pl-2 text-xs font-semibold text-subtle uppercase">{{ item.label }}</div>
            <Card v-else :icon="item.icon ?? undefined" :is-compact="true" :label="item.label" />
        </template>

        <template #detail="{ item }">
            <ContextModelPanel :model-reference="item" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a focus from the list.'" />
        </template>
    </GridDetailPanel>
</template>
