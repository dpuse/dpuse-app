<script setup lang="ts">
// ── External Dependencies & Registrations
import { type Component, computed, type ShallowRef } from 'vue';

// ── DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT } from './PluginList_.json';
import { useCardRowHeight } from '@/components/ui/config/configCard';
import { useSetupSelection } from '../useSetupSelection';
import { assertDefined, defineLazyComponent } from '@/utilities/index.ts';
import { configStatus, connectorConfigs, cookbookConfigs, presenterConfigs, toolConfigs } from '@/state/configs';
import { localeId, t } from '@/state/locale';
import type { PluginConfig, SetupOptionConfig } from '@/features/studio/setup/useSetupOptions';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import RetrievalGate from '@/components/ui/RetrievalGate.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';

// ── Dynamic Components
const PluginConnectorPanel = defineLazyComponent(() => import('@/features/studio/setup/plugins/PluginConnectorPanel.vue'), 'PluginConnectorPanel');
const PluginCookbookPanel = defineLazyComponent(() => import('@/features/studio/setup/plugins/PluginCookbookPanel.vue'), 'PluginCookbookPanel');
const PluginPresenterPanel = defineLazyComponent(() => import('@/features/studio/setup/plugins/PluginPresenterPanel.vue'), 'PluginPresenterPanel');
const PluginToolPanel = defineLazyComponent(() => import('@/features/studio/setup/plugins/PluginToolPanel.vue'), 'PluginToolPanel');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TAB_CONFIGS: Partial<Record<string, { configs: ShallowRef<PluginConfig[]>; panel: Component; selectKey: keyof typeof TEXT }>> = {
    connectors: { configs: connectorConfigs, panel: PluginConnectorPanel, selectKey: 'selectConnector.text' },
    cookbooks: { configs: cookbookConfigs, panel: PluginCookbookPanel, selectKey: 'selectCookbook.text' },
    presenters: { configs: presenterConfigs, panel: PluginPresenterPanel, selectKey: 'selectPresenter.text' },
    tools: { configs: toolConfigs, panel: PluginToolPanel, selectKey: 'selectTool.text' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { setupOptionLocalisedConfig } = defineProps<{ setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig> }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Cards here carry no badges or actions, so they are one row.
const cardRowHeight = useCardRowHeight(false);

const pluginLocalisedConfigs = computed(() => localiseConfigs<PluginConfig>(tabActiveConfig.value.configs.value, localeId.value, true)); // Derived, so a language switch re-localises.
const tabActiveConfig = computed(() => assertDefined(TAB_CONFIGS[setupOptionLocalisedConfig.id], `Expected a plugin tab config with id '${setupOptionLocalisedConfig.id}'.`));
const {
    activeItem: pluginLocalisedConfigActive,
    dataSource: pluginLocalisedConfigsDataSource,
    selectItem
} = useSetupSelection(pluginLocalisedConfigs, () => configStatus.value.typeId !== 'pending');

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectPlugin(localisedConfig: LocalisedConfig<PluginConfig>): void {
    selectItem(localisedConfig);
}
</script>

<template>
    <RetrievalGate :status="configStatus">
        <GridDetailPanel
            :selected-item="pluginLocalisedConfigActive"
            class="min-h-0 flex-1"
            :data-source="pluginLocalisedConfigsDataSource"
            max-detail-width="65ch"
            :row-height="cardRowHeight"
        >
            <template #item="{ item }">
                <ConfigCard :config="item" :selected="item.id === pluginLocalisedConfigActive?.id" @click="handleSelectPlugin(item)" />
            </template>

            <template #detail="{ item, close }">
                <component :is="tabActiveConfig.panel" :plugin-localised-config="item" :setup-option-localised-config="setupOptionLocalisedConfig" @close="close" />
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="t(TEXT, tabActiveConfig.selectKey)" />
            </template>
        </GridDetailPanel>
    </RetrievalGate>
</template>
