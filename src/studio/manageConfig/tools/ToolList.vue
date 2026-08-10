<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── API Framework
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';
import { configsAreRetrieved, toolConfigs } from '@/state/session';

// ── Local Components - Static
import ConfigCard from '@/components/framework/ConfigCard.vue';
import DetailActionBar from '@/components/framework/gridDetailPanel/DetailActionBar.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import ToolForm from './ToolForm.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeToolConfig = shallowRef<LocalisedConfig<ToolConfig> | undefined>();
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
    activeToolConfig.value = toolLocalisedConfig;
}
</script>

<template>
    <GridDetailPanel :active-item="activeToolConfig" class="min-h-0 flex-1" :data-source="toolConfigsDataSource" max-detail-width="650px" @select="handleSelectTool">
        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :config="item" />
        </template>

        <template #detail="{ item, clear }">
            <div class="relative flex min-h-0 flex-1 flex-col">
                <ToolForm :tool-localised-config="item" />
                <DetailActionBar class="absolute right-4 bottom-(--safe-bottom-offset)" @clear="clear" />
            </div>
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a tool from the list.'" />
        </template>
    </GridDetailPanel>
</template>
