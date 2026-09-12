<script setup lang="ts">
// ── External Dependencies & Registrations
import { type Component, computed, type ShallowRef, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import T from './_PluginList.json';
import { type ConfigOptionConfig, defineAsyncPanel, type PluginConfig } from '@/utilities/index.ts';
import { configRetrievalFailed, configRetrievalFailure, configRetrievalSucceeded, connectorConfigs, cookbookConfigs, presenterConfigs, toolConfigs } from '@/state/session';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ErrorShell from '@/components/ui/error/ErrorShell.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';

// ── Dynamic Components
const PluginConnectorPanel = defineAsyncPanel(() => import('@/features/studio/config/plugins/PluginConnectorPanel.vue'), 'PluginConnectorPanel');
const PluginCookbookPanel = defineAsyncPanel(() => import('@/features/studio/config/plugins/PluginCookbookPanel.vue'), 'PluginCookbookPanel');
const PluginPresenterPanel = defineAsyncPanel(() => import('@/features/studio/config/plugins/PluginPresenterPanel.vue'), 'PluginPresenterPanel');
const PluginToolPanel = defineAsyncPanel(() => import('@/features/studio/config/plugins/PluginToolPanel.vue'), 'PluginToolPanel');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Everything that varies between the module types this list serves. Keyed by the tab identifier in
// 'ConfigLayout', which arrives as 'config.id'. The configs entry is the state ref itself
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

const { config } = defineProps<{ config: LocalisedConfig<ConfigOptionConfig> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const localisedConfigs = shallowRef<LocalisedConfig<PluginConfig>[]>([]);
const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Derived from the route rather than held as its own ref, so an external change to 'configId' — e.g. re-clicking
// the active tab in 'ConfigLayout' to clear it — is reflected without a dedicated watcher of its own.
const activeLocalisedConfig = computed(() =>
    typeof route.params.configId === 'string' ? localisedConfigs.value.find((config) => config.id === route.params.configId) : undefined
);
const moduleTypeConfig = computed(() => MODULE_TYPE_CONFIGS[config.id]);

const configsDataSource = computed<DataSource<LocalisedConfig<PluginConfig>>>(() => ({
    // Settled either way: an undefined count means 'not yet known' and leaves the grid busy, so checking only the
    // success flag left it spinning for the rest of the session when retrieval failed.
    rowCount: configRetrievalSucceeded.value || configRetrievalFailed.value ? localisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<PluginConfig>[] }> => Promise.resolve({ rows: localisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => moduleTypeConfig.value.configs.value,
    (newConfigs) => (localisedConfigs.value = localiseConfigs<PluginConfig>(newConfigs, localeId.value, true)),
    { immediate: true }
);

// Clears a 'configId' that matches nothing (e.g. a bookmarked link to a since-removed config) once retrieval has
// settled either way.
watch(
    localisedConfigs,
    (newConfigs) => {
        if (typeof route.params.configId !== 'string') return;
        if (newConfigs.some((config) => config.id === route.params.configId)) return;
        if (configRetrievalSucceeded.value || configRetrievalFailed.value) updateConfigIdParameter();
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelect(localisedConfig: LocalisedConfig<PluginConfig> | undefined): void {
    updateConfigIdParameter(activeLocalisedConfig.value?.id === localisedConfig?.id ? undefined : localisedConfig?.id);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

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
