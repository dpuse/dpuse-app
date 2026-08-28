<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';
import type { DataSource } from '@/composables/useDataWindow';
import { configRetrievalSucceeded, toolConfigs } from '@/state/session';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/ConfigCard.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import ToolPanel from './ToolPanel.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Select_tool: { en: 'Select a tool from the list.', es: 'Selecciona una herramienta de la lista.' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineProps<{ activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeToolLocalisedConfig = shallowRef<LocalisedConfig<ToolConfig> | undefined>();
const toolLocalisedConfigs = shallowRef<LocalisedConfig<ToolConfig>[]>([]);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const toolConfigsDataSource = computed<DataSource<LocalisedConfig<ToolConfig>>>(() => ({
    rowCount: configRetrievalSucceeded.value ? toolLocalisedConfigs.value.length : undefined,
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
        :row-height="16 + 16 + 28 + 16"
        @select="handleSelectTool"
    >
        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :config="item" :selected="item.id === activeToolLocalisedConfig?.id" />
        </template>

        <template #detail="{ item, clear, close }">
            <ToolPanel :active-config-option-config="activeConfigOptionConfig" :tool-localised-config="item" @clear="clear" @close="close" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(T, 'Select_tool')" />
        </template>
    </GridDetailPanel>
</template>
