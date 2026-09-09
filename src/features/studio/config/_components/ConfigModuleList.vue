<script setup lang="ts">
// ── External Dependencies & Registrations
import { type Component, computed, type ShallowRef, shallowRef, watch } from 'vue';

// ── DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import type { ConfigOptionConfig, ManagedModuleConfig } from '@/utilities/index.ts';
import { configRetrievalFailed, configRetrievalFailure, configRetrievalSucceeded, connectorConfigs, cookbookConfigs, presenterConfigs, toolConfigs } from '@/state/session';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ErrorShell from '@/components/ui/error/ErrorShell.vue';
import ConfigConnectorPanel from '@/features/studio/config/ConfigConnectorPanel.vue';
import ConfigCookbookPanel from '@/features/studio/config/ConfigCookbookPanel.vue';
import ConfigPresenterPanel from '@/features/studio/config/ConfigPresenterPanel.vue';
import ConfigToolPanel from '@/features/studio/config/ConfigToolPanel.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'selectConnector.text': { en: 'Select a connector from the list.', es: 'Selecciona un conector de la lista.' },
    'selectCookbook.text': { en: 'Select a cookbook from the list.', es: 'Selecciona un recetario de la lista.' },
    'selectPresenter.text': { en: 'Select a presenter from the list.', es: 'Selecciona un presentador de la lista.' },
    'selectTool.text': { en: 'Select a tool from the list.', es: 'Selecciona una herramienta de la lista.' }
};

// Everything that varies between the module types this list serves. Keyed by the tab identifier in
// 'ConfigLayout', which arrives as 'activeConfigOptionConfig.id'. The configs entry is the state ref itself
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

const { activeConfigOptionConfig } = defineProps<{ activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeLocalisedConfig = shallowRef<LocalisedConfig<ManagedModuleConfig> | undefined>();
const localisedConfigs = shallowRef<LocalisedConfig<ManagedModuleConfig>[]>([]);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const moduleTypeConfig = computed(() => MODULE_TYPE_CONFIGS[activeConfigOptionConfig.id]);

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

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelect(localisedConfig: LocalisedConfig<ManagedModuleConfig> | undefined): void {
    activeLocalisedConfig.value = localisedConfig;
}
</script>

<template>
    <!-- The list is empty because the configurations never arrived, not because there are none. Covers the region: an
         empty grid with no explanation is what this replaces, and the app-level announcement of the same failure can
         be dismissed, after which this is all that is left to say why. -->
    <ErrorShell v-if="configRetrievalFailure" covers-region :can-retry="false" :failures="[configRetrievalFailure]" />

    <GridDetailPanel
        v-else
        :active-item="activeLocalisedConfig"
        class="min-h-0 flex-1"
        :data-source="configsDataSource"
        max-detail-width="65ch"
        :row-height="16 + 16 + 28 + 16"
        @select="handleSelect"
    >
        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :config="item" :selected="item.id === activeLocalisedConfig?.id" />
        </template>

        <template #detail="{ item, clear, close }">
            <component :is="moduleTypeConfig.panel" :active-config-option-config="activeConfigOptionConfig" :localised-config="item" @clear="clear" @close="close" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(T, moduleTypeConfig.selectKey)" />
        </template>
    </GridDetailPanel>
</template>
