<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ComponentBaseConfig } from '@dpuse/dpuse-shared/component';
import type { ContextConfig } from '@dpuse/dpuse-shared/component/context';
import { localiseConfig, type LocalisedConfig, localiseReference } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';
import type { DataSource } from '@/composables/useDataWindow';
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

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'selectFocus.text': { en: 'Select a focus from the list.', es: 'Selecciona un foco de la lista.' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineProps<{ config: LocalisedConfig<ConfigOptionConfig> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const contextConfig = shallowRef<ContextConfig>();
const contextLocalisedConfig = shallowRef<LocalisedConfig<ContextConfig>>();
const contextConfigIsLoading = ref(true);
const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Derived from the route rather than held as its own ref, so an external change to 'configId' — e.g. re-clicking
// the active tab in 'ConfigLayout' to clear it — is reflected without a dedicated watcher of its own.
const activeModelReference = computed(() =>
    typeof route.params.configId === 'string' ? buildLocalisedModels().find((model) => model.isHeader !== true && model.id === route.params.configId) : undefined
);
const modelReferencesDataSource = computed<DataSource<GridListItem<LocalisedConfig<ComponentBaseConfig>>>>(() =>
    contextConfigIsLoading.value ? { rowCount: undefined, rows: [] } : getModels()
);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/require-await -- Code pending...
async function loadContextConfig(): Promise<ContextConfig> {
    // TODO: return (await fetch('/api/context-config')).json() as Promise<ContextConfig>;
    return contextConfigData as ContextConfig;
}

// NOTE: Prefer this approach to using Suspense.
void (async (): Promise<void> => {
    contextConfig.value = await loadContextConfig();
    contextConfigIsLoading.value = false;
})();

watch(contextConfig, (newContextConfig) => {
    if (!newContextConfig) return;
    contextLocalisedConfig.value = localiseConfig<ContextConfig>(newContextConfig, localeId.value);
});

// Clears a 'configId' that matches nothing (e.g. a bookmarked link to a since-removed model) once the models have
// loaded — a stray id from another tab is not a case this needs to handle: 'configId' is this route's own optional
// path param, so it cannot survive a navigation to another route.
watch(
    contextConfigIsLoading,
    (isLoading) => {
        if (isLoading || typeof route.params.configId !== 'string') return;
        if (buildLocalisedModels().some((model) => model.isHeader !== true && model.id === route.params.configId)) return;
        updateConfigIdParameter();
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectModel(modelReference: GridListItem<LocalisedConfig<ComponentBaseConfig>> | undefined): void {
    updateConfigIdParameter(modelReference?.id);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// An explicit 'name' is required even though this stays on the same route: it is what makes an absent 'configId'
// actually clear the param instead of inheriting the one already in the URL — see 'router/index.ts' for why.
function updateConfigIdParameter(configId?: string): void {
    void router.replace({ name: route.name ?? undefined, params: { configId }, query: route.query }).catch(() => {
        // Already reported by 'router.onError'.
    });
}

function buildLocalisedModels(): GridListItem<LocalisedConfig<ComponentBaseConfig>>[] {
    const localisedModels: GridListItem<LocalisedConfig<ComponentBaseConfig>>[] = [];
    const areas = contextConfig.value?.areas ?? [];
    for (const area of areas) {
        const la = localiseReference(area, localeId.value);
        localisedModels.push({ ...la, isHeader: true });
        for (const model of area.models) {
            const lr = localiseReference(model, localeId.value);
            localisedModels.push({ ...lr, isHeader: false });
        }
    }
    return localisedModels;
}

function getModels(): DataSource<GridListItem<LocalisedConfig<ComponentBaseConfig>>> {
    const localisedModels = buildLocalisedModels();
    return {
        rowCount: localisedModels.length,
        rows: localisedModels
    };
}
</script>

<template>
    <GridDetailPanel :active-item="activeModelReference" class="min-h-0 flex-1" :data-source="modelReferencesDataSource" :is-compact="true" max-grid-width="350px">
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
