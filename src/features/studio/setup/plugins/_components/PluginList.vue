<script setup lang="ts">
// ── External Dependencies & Registrations
import { type Component, computed, type ShallowRef } from 'vue';

// ── DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { T } from './PluginList_.json';
import { useSetupSelection } from '../../useSetupSelection';
import { assertDefined, defineAsyncPanel, type PluginConfig, type SetupOptionConfig } from '@/utilities/index.ts';
import { configRetrievalFailed, configRetrievalFailure, configRetrievalSucceeded, connectorConfigs, cookbookConfigs, presenterConfigs, toolConfigs } from '@/state/session';
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

const TAB_CONFIGS: Partial<Record<string, { configs: ShallowRef<PluginConfig[]>; panel: Component; selectKey: keyof typeof T }>> = {
    connectors: { configs: connectorConfigs, panel: PluginConnectorPanel, selectKey: 'selectConnector.text' },
    cookbooks: { configs: cookbookConfigs, panel: PluginCookbookPanel, selectKey: 'selectCookbook.text' },
    presenters: { configs: presenterConfigs, panel: PluginPresenterPanel, selectKey: 'selectPresenter.text' },
    tools: { configs: toolConfigs, panel: PluginToolPanel, selectKey: 'selectTool.text' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { setupOptionLocalisedConfig } = defineProps<{ setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig> }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const pluginLocalisedConfigs = computed(() => localiseConfigs<PluginConfig>(tabActiveConfig.value.configs.value, localeId.value, true)); // Derived, so a language switch re-localises.
const tabActiveConfig = computed(() => assertDefined(TAB_CONFIGS[setupOptionLocalisedConfig.id], `Expected a plugin tab config with id '${setupOptionLocalisedConfig.id}'.`));
const {
    activeItem: pluginLocalisedConfigActive,
    dataSource: pluginLocalisedConfigsDataSource,
    selectItem
} = useSetupSelection(pluginLocalisedConfigs, () => configRetrievalSucceeded.value || configRetrievalFailed.value);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectPlugin(localisedConfig: LocalisedConfig<PluginConfig>): void {
    selectItem(localisedConfig);
}
</script>

<template>
    <!-- Error Notice - Failed to retrieve context/plugin configuration. -->
    <ErrorNotice v-if="configRetrievalFailure" covers-region :can-retry="false" :failures="[configRetrievalFailure]" />

    <GridDetailPanel
        v-else
        :active-item="pluginLocalisedConfigActive"
        class="min-h-0 flex-1"
        :data-source="pluginLocalisedConfigsDataSource"
        max-detail-width="65ch"
        :row-height="16 + 16 + 28 + 16"
    >
        <template #item="{ item }">
            <ConfigCard :config="item" :selected="item.id === pluginLocalisedConfigActive?.id" @click="handleSelectPlugin(item)" />
        </template>

        <template #detail="{ item, close }">
            <component :is="tabActiveConfig.panel" :plugin-localised-config="item" :setup-option-localised-config="setupOptionLocalisedConfig" @close="close" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(T, tabActiveConfig.selectKey)" />
        </template>
    </GridDetailPanel>
</template>
