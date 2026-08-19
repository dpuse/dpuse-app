<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBaseConfig } from '@dpuse/dpuse-shared/component';
import type { ContextConfig } from '@dpuse/dpuse-shared/component/context';
import { localiseConfig, type LocalisedConfig, localiseReference } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';

// ── Local Components - Static
import ConfigCard from '@/components/framework/ConfigCard.vue';
import ContextModelPanel from './ContextModelPanel.vue';
import GridDetailPanel from '@/components/framework/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

// ── Data ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

import contextConfigData from './data/contextConfig.json';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type GridListItem<T> = T & { isHeader?: boolean };

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeModelReference = shallowRef<GridListItem<LocalisedConfig<ComponentBaseConfig>> | undefined>();
const contextConfig = shallowRef<ContextConfig>();
const contextLocalisedConfig = shallowRef<LocalisedConfig<ContextConfig>>();
const contextConfigIsLoading = ref(true);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const modelReferencesDataSource = computed<DataSource<GridListItem<LocalisedConfig<ComponentBaseConfig>>>>(() =>
    contextConfigIsLoading.value ? { rowCount: undefined, rows: [] } : getModels()
);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadContextConfig(): Promise<ContextConfig> {
    // TODO: return (await fetch('/api/context-config')).json() as Promise<ContextConfig>;
    return contextConfigData as ContextConfig;
}

// eslint-disable-next-line unicorn/prefer-top-level-await -- Prefer this approach to using Suspense.
(async (): Promise<void> => {
    contextConfig.value = await loadContextConfig();
    contextConfigIsLoading.value = false;
})();

watch(contextConfig, (newContextConfig) => {
    if (!newContextConfig) return;
    contextLocalisedConfig.value = localiseConfig<ContextConfig>(newContextConfig, localeId.value);
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSelectModel(modelReference: GridListItem<LocalisedConfig<ComponentBaseConfig>> | undefined): Promise<void> {
    activeModelReference.value = modelReference;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function getModels(): DataSource<GridListItem<LocalisedConfig<ComponentBaseConfig>>> {
    const localisedModels: GridListItem<LocalisedConfig<ComponentBaseConfig>>[] = [];
    for (const area of contextConfig.value!.areas) {
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
            <div v-if="item.isHeader" class="pl-2 text-left text-xs font-semibold text-subtle uppercase">{{ item.label }}</div>
            <ConfigCard v-else :is-compact="true" :config="item" />
        </template>

        <template #detail="{ item }">
            <ContextModelPanel :model-reference="item" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a focus from the list.'" />
        </template>
    </GridDetailPanel>
</template>
