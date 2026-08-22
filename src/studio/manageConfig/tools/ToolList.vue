<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '../ManageConfigLayout.vue';
import type { DataSource } from '@/composables/useDataWindow';
import { configsAreRetrieved, toolConfigs } from '@/state/session';
import { localeId, t } from '@/state/locale';

// ── Local Components - Static
import ConfigCard from '~/src/components/ui/ConfigCard.vue';
import GridDetailPanel from '~/src/components/ui/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import ToolPanel from './ToolPanel.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Select_tool: { en: 'Select a tool from the list.', es: 'Selecciona una herramienta de la lista.' }
};

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

defineProps<{ activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeToolLocalisedConfig = shallowRef<LocalisedConfig<ToolConfig> | undefined>();
const toolLocalisedConfigs = shallowRef<LocalisedConfig<ToolConfig>[]>([]);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const toolConfigsDataSource = computed<DataSource<LocalisedConfig<ToolConfig>>>(() => ({
    rowCount: configsAreRetrieved.value ? toolLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<ToolConfig>[] }> => Promise.resolve({ rows: toolLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(toolConfigs, (newToolConfigs) => (toolLocalisedConfigs.value = localiseConfigs<ToolConfig>(newToolConfigs, localeId.value, true)), {
    immediate: true
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectTool(toolLocalisedConfig: LocalisedConfig<ToolConfig> | undefined): void {
    activeToolLocalisedConfig.value = toolLocalisedConfig;
}
</script>

<template>
    <GridDetailPanel
        :active-item="activeToolLocalisedConfig"
        class="min-h-0 flex-1"
        :data-source="toolConfigsDataSource"
        max-detail-width="65ch"
        :row-height="122"
        @select="handleSelectTool"
    >
        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :config="item" :selected="item.id === activeToolLocalisedConfig?.id" />
        </template>

        <template #detail="{ item, clear }">
            <ToolPanel :active-config-option-config="activeConfigOptionConfig" :tool-localised-config="item" @close="clear" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(T, 'Select_tool')" />
        </template>
    </GridDetailPanel>
</template>
