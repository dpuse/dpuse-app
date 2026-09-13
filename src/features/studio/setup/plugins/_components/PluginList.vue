<script setup lang="ts">
// ── External Dependencies & Registrations
import { type Component, computed, type ShallowRef, shallowRef, watch } from 'vue';

// ── DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import T from './_PluginList.json';
import { useSetupRouteId } from '../../useSetupRouteId';
import { configRetrievalFailed, configRetrievalFailure, configRetrievalSucceeded, connectorConfigs, cookbookConfigs, presenterConfigs, toolConfigs } from '@/state/session';
import { defineAsyncPanel, type PluginConfig, type SetupOptionConfig } from '@/utilities/index.ts';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';

// ── Dynamic Components
const PluginConnectorPanel = defineAsyncPanel(() => import('@/features/studio/setup/plugins/PluginConnectorPanel.vue'), 'PluginConnectorPanel');
const PluginCookbookPanel = defineAsyncPanel(() => import('@/features/studio/setup/plugins/PluginCookbookPanel.vue'), 'PluginCookbookPanel');
const PluginPresenterPanel = defineAsyncPanel(() => import('@/features/studio/setup/plugins/PluginPresenterPanel.vue'), 'PluginPresenterPanel');
const PluginToolPanel = defineAsyncPanel(() => import('@/features/studio/setup/plugins/PluginToolPanel.vue'), 'PluginToolPanel');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Everything that varies between the module types this list serves. Keyed by the tab identifier in
// 'SetupLayout', which arrives as 'setupOptionLocalisedConfig.id'. The configs entry is the state ref itself
// rather than its value, so the watch below re-runs when the underlying array is replaced.
interface ModuleTypeConfig {
    configs: ShallowRef<PluginConfig[]>;
    panel: Component;
    selectKey: keyof typeof T;
}
const MODULE_TYPE_CONFIGS: Record<string, ModuleTypeConfig> = {
    connectors: { configs: connectorConfigs, panel: PluginConnectorPanel, selectKey: 'selectConnector.text' },
    cookbooks: { configs: cookbookConfigs, panel: PluginCookbookPanel, selectKey: 'selectCookbook.text' },
    presenters: { configs: presenterConfigs, panel: PluginPresenterPanel, selectKey: 'selectPresenter.text' },
    tools: { configs: toolConfigs, panel: PluginToolPanel, selectKey: 'selectTool.text' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { setupOptionLocalisedConfig } = defineProps<{ setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const pluginLocalisedConfigs = shallowRef<LocalisedConfig<PluginConfig>[]>([]);
const { routeId, setRouteId } = useSetupRouteId();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const pluginActiveLocalisedConfig = computed(
    () => (routeId.value === undefined ? undefined : pluginLocalisedConfigs.value.find((config) => config.id === routeId.value)) // Use route so tabs clicks also register (clear selection).
);
const moduleTypeConfig = computed(() => MODULE_TYPE_CONFIGS[setupOptionLocalisedConfig.id]);
const pluginLocalisedConfigsDataSource = computed<DataSource<LocalisedConfig<PluginConfig>>>(() => ({
    rowCount: configRetrievalSucceeded.value || configRetrievalFailed.value ? pluginLocalisedConfigs.value.length : undefined, // Set count on success or failure, not pending.
    getRows: (start, end): Promise<{ rows: LocalisedConfig<PluginConfig>[] }> => Promise.resolve({ rows: pluginLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => moduleTypeConfig.value.configs.value,
    (newConfigs) => (pluginLocalisedConfigs.value = localiseConfigs<PluginConfig>(newConfigs, localeId.value, true)),
    { immediate: true }
);

watch(
    pluginLocalisedConfigs,
    (newConfigs) => {
        if (routeId.value === undefined) return; // Exit if no plugin identifier in url.
        if (newConfigs.some((config) => config.id === routeId.value)) return; // Exit if valid plugin identifier in url.
        if (configRetrievalSucceeded.value || configRetrievalFailed.value) setRouteId(undefined); // Only clear invalid plugin identifier from utl once retrieval is finalised.
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelect(localisedConfig: LocalisedConfig<PluginConfig> | undefined): void {
    setRouteId(pluginActiveLocalisedConfig.value?.id === localisedConfig?.id ? undefined : localisedConfig?.id);
}
</script>

<template>
    <!-- The list is empty because the configurations never arrived, not because there are none. Covers the region: an
         empty grid with no explanation is what this replaces, and the app-level announcement of the same failure can
         be dismissed, after which this is all that is left to say why. -->
    <ErrorNotice v-if="configRetrievalFailure" covers-region :can-retry="false" :failures="[configRetrievalFailure]" />

    <GridDetailPanel
        v-else
        :active-item="pluginActiveLocalisedConfig"
        class="min-h-0 flex-1"
        :data-source="pluginLocalisedConfigsDataSource"
        max-detail-width="65ch"
        :row-height="16 + 16 + 28 + 16"
    >
        <template #item="{ item }">
            <ConfigCard v-if="item" :config="item" :selected="item.id === pluginActiveLocalisedConfig?.id" @click="handleSelect(item)" />
        </template>

        <template #detail="{ item, close }">
            <component :is="moduleTypeConfig.panel" :config="setupOptionLocalisedConfig" :localised-config="item" @close="close" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(T, moduleTypeConfig.selectKey)" />
        </template>
    </GridDetailPanel>
</template>
