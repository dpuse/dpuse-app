<script setup lang="ts">
// ── External Dependencies & Registrations
import { type Component, computed, type ShallowRef, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { type ConfigOptionConfig, defineAsyncPanel, type ManagedModuleConfig } from '@/utilities/index.ts';
import { configRetrievalFailed, configRetrievalFailure, configRetrievalSucceeded, connectorConfigs, cookbookConfigs, presenterConfigs, toolConfigs } from '@/state/session';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ErrorShell from '@/components/ui/error/ErrorShell.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';

// ── Dynamic Components
const ConfigConnectorPanel = defineAsyncPanel(() => import('@/features/studio/config/modules/ConfigConnectorPanel.vue'), 'ConfigConnectorPanel');
const ConfigCookbookPanel = defineAsyncPanel(() => import('@/features/studio/config/modules/ConfigCookbookPanel.vue'), 'ConfigCookbookPanel');
const ConfigPresenterPanel = defineAsyncPanel(() => import('@/features/studio/config/modules/ConfigPresenterPanel.vue'), 'ConfigPresenterPanel');
const ConfigToolPanel = defineAsyncPanel(() => import('@/features/studio/config/modules/ConfigToolPanel.vue'), 'ConfigToolPanel');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'selectConnector.text': { en: 'Select a connector from the list.', es: 'Selecciona un conector de la lista.' },
    'selectCookbook.text': { en: 'Select a cookbook from the list.', es: 'Selecciona un recetario de la lista.' },
    'selectPresenter.text': { en: 'Select a presenter from the list.', es: 'Selecciona un presentador de la lista.' },
    'selectTool.text': { en: 'Select a tool from the list.', es: 'Selecciona una herramienta de la lista.' }
};

// Everything that varies between the module types this list serves. Keyed by the tab identifier in
// 'ConfigLayout', which arrives as 'config.id'. The configs entry is the state ref itself
// rather than its value, so the watch below re-runs when the underlying array is replaced.
interface ModuleTypeConfig {
    configs: ShallowRef<ManagedModuleConfig[]>;
    panel: Component;
    selectKey: keyof typeof T;
}
const MODULE_TYPE_CONFIGS: Record<string, ModuleTypeConfig> = {
    connectors: { configs: connectorConfigs, panel: ConfigConnectorPanel, selectKey: 'selectConnector.text' },
    cookbooks: { configs: cookbookConfigs, panel: ConfigCookbookPanel, selectKey: 'selectCookbook.text' },
    presenters: { configs: presenterConfigs, panel: ConfigPresenterPanel, selectKey: 'selectPresenter.text' },
    tools: { configs: toolConfigs, panel: ConfigToolPanel, selectKey: 'selectTool.text' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { config } = defineProps<{ config: LocalisedConfig<ConfigOptionConfig> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeLocalisedConfig = shallowRef<LocalisedConfig<ManagedModuleConfig> | undefined>();
const localisedConfigs = shallowRef<LocalisedConfig<ManagedModuleConfig>[]>([]);
const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const moduleTypeConfig = computed(() => MODULE_TYPE_CONFIGS[config.id]);

const configsDataSource = computed<DataSource<LocalisedConfig<ManagedModuleConfig>>>(() => ({
    // Settled either way: an undefined count means 'not yet known' and leaves the grid busy, so checking only the
    // success flag left it spinning for the rest of the session when retrieval failed.
    rowCount: configRetrievalSucceeded.value || configRetrievalFailed.value ? localisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<ManagedModuleConfig>[] }> => Promise.resolve({ rows: localisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => moduleTypeConfig.value.configs.value,
    (newConfigs) => (localisedConfigs.value = localiseConfigs<ManagedModuleConfig>(newConfigs, localeId.value, true)),
    { immediate: true }
);

// Restores the selection from the URL on reload. Also clears a 'configId' that no longer matches anything once
// retrieval settles — e.g. a bookmarked link to a since-deleted item — so the URL does not keep pointing at nothing.
watch(
    localisedConfigs,
    (newConfigs) => {
        if (typeof route.params.configId !== 'string') return;
        const restoredConfig = newConfigs.find((config) => config.id === route.params.configId);
        if (restoredConfig) activeLocalisedConfig.value = restoredConfig;
        else if (configRetrievalSucceeded.value || configRetrievalFailed.value) updateConfigIdParameter();
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelect(localisedConfig: LocalisedConfig<ManagedModuleConfig> | undefined): void {
    activeLocalisedConfig.value = localisedConfig;
    updateConfigIdParameter(localisedConfig?.id);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// An explicit 'name' is required even though this stays on the same route: it is what makes an absent 'configId'
// actually clear the param instead of inheriting the one already in the URL — see 'router/index.ts' for why.
function updateConfigIdParameter(configId?: string): void {
    void router.replace({ name: route.name ?? undefined, params: { configId }, query: route.query }).catch(() => {
        // Already reported by 'router.onError'.
    });
}
</script>

<template>
    <!-- The list is empty because the configurations never arrived, not because there are none. Covers the region: an
         empty grid with no explanation is what this replaces, and the app-level announcement of the same failure can
         be dismissed, after which this is all that is left to say why. -->
    <ErrorShell v-if="configRetrievalFailure" covers-region :can-retry="false" :failures="[configRetrievalFailure]" />

    <GridDetailPanel v-else :active-item="activeLocalisedConfig" class="min-h-0 flex-1" :data-source="configsDataSource" max-detail-width="65ch" :row-height="16 + 16 + 28 + 16">
        <template #item="{ item }">
            <ConfigCard v-if="item" :config="item" :selected="item.id === activeLocalisedConfig?.id" @click="handleSelect(item)" />
        </template>

        <template #detail="{ item, close }">
            <component :is="moduleTypeConfig.panel" :config="config" :localised-config="item" @close="close" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(T, moduleTypeConfig.selectKey)" />
        </template>
    </GridDetailPanel>
</template>
