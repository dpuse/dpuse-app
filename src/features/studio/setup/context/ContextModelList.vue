<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ComponentBaseConfig } from '@dpuse/dpuse-shared/component';
import type { ContextConfig } from '@dpuse/dpuse-shared/component/context';
import { type LocalisedConfig, localiseReference } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import type { SetupOptionConfig } from '@/utilities/index.ts';
import { T } from './ContextModelList_.json';
import { useSetupRoute } from '../useSetupRoute';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ContextModelPanel from './ContextModelPanel.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';

// ── Data
import contextConfigData from './data/contextConfig.json';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type GridListItem<T> = T & { isHeader?: boolean };

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineProps<{ setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const contextConfig = shallowRef<ContextConfig>();
const contextConfigIsLoading = ref(true);
const { routeId, setRouteId } = useSetupRoute();

// ── Initialisation ───────────────────────────────────────────────────────────────────────────────────────────────────

// NOTE: Prefer this approach to using Suspense.
// TODO: Once 'loadContextConfig' does a real fetch, catch its failure here and surface it via 'ErrorNotice', the
// way 'PluginList' does with 'configRetrievalFailure'. No failure path exists yet because there is nothing to fail.
void (async (): Promise<void> => {
    contextConfig.value = await loadContextConfig();
    contextConfigIsLoading.value = false;
})();

// eslint-disable-next-line @typescript-eslint/require-await -- Code pending...
async function loadContextConfig(): Promise<ContextConfig> {
    // TODO: return (await fetch('/api/context-config')).json() as Promise<ContextConfig>;
    return contextConfigData as ContextConfig;
}

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Cached rather than rebuilt per access: it was a plain function called from three separate places, each re-walking
// 'contextConfig' from scratch.
const localisedModels = computed<GridListItem<LocalisedConfig<ComponentBaseConfig>>[]>(() => {
    const models: GridListItem<LocalisedConfig<ComponentBaseConfig>>[] = [];
    const areas = contextConfig.value?.areas ?? [];
    for (const area of areas) {
        const la = localiseReference(area, localeId.value);
        models.push({ ...la, isHeader: true });
        for (const model of area.models) {
            const lr = localiseReference(model, localeId.value);
            models.push({ ...lr, isHeader: false });
        }
    }
    return models;
});
const modelActiveReference = computed(() =>
    routeId.value === undefined ? undefined : localisedModels.value.find((model) => model.isHeader !== true && model.id === routeId.value)
);
const modelReferencesDataSource = computed<DataSource<GridListItem<LocalisedConfig<ComponentBaseConfig>>>>(() =>
    contextConfigIsLoading.value ? { rowCount: undefined, rows: [] } : getModels()
);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    contextConfigIsLoading,
    (newContextConfigIsLoading) => {
        if (newContextConfigIsLoading || routeId.value === undefined) return; // Exit if context config is loading or no model identifier in url.
        if (localisedModels.value.some((model) => model.isHeader !== true && model.id === routeId.value)) return; // Exit if valid model identifier in url.
        setRouteId(undefined); // Only clear invalid model identifier from url once retrieval is finalised.
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectModel(modelReference: GridListItem<LocalisedConfig<ComponentBaseConfig>> | undefined): void {
    setRouteId(modelReference?.id);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function getModels(): DataSource<GridListItem<LocalisedConfig<ComponentBaseConfig>>> {
    return {
        rowCount: localisedModels.value.length,
        rows: localisedModels.value
    };
}
</script>

<template>
    <GridDetailPanel :active-item="modelActiveReference" class="min-h-0 flex-1" :data-source="modelReferencesDataSource" :is-compact="true" max-grid-width="350px">
        <template #item="{ item }">
            <div v-if="item.isHeader" class="pl-2 text-left text-xs font-semibold text-subtle uppercase">{{ item.label }}</div>
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
