<script setup lang="ts">
// External Dependencies
import { computed, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local (App) Framework
import { connectionConfigs } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';
import { activeConnectionConfig, activeDataViewConfig } from '@/state/establishDataViews';

// Local Components - Static
import Card from '@/components/ui/card/Card.vue';
import GridDetailPanel from '@/components/layout/gridDetailPanel/GridDetailPanel.vue';
import SelectConnectionForm from './SelectConnectionForm.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import type { StepConfig } from '@/components/ui/steps/Steps.vue';
import Tile from '@/components/ui/tile/Tile.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { stepLocalisedConfig } = defineProps<{ stepLocalisedConfig: LocalisedConfig<StepConfig> }>();

defineEmits<{ 'step-completed': [stepLocalisedConfig: LocalisedConfig<StepConfig>] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionLocalisedConfigs = shallowRef<LocalisedConfig<ConnectionConfig>[]>([]);

const dataSource = computed<DataSource<LocalisedConfig<ConnectionConfig>>>(() => ({
    rowCount: connectionLocalisedConfigs.value.length,
    getRows: (start, end): Promise<LocalisedConfig<ConnectionConfig>[]> => Promise.resolve(connectionLocalisedConfigs.value.slice(start, end))
}));

const route = useRoute();
const router = useRouter();

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(connectionConfigs, (newConnectionConfigs) => (connectionLocalisedConfigs.value = localiseConfigs<ConnectionConfig>(newConnectionConfigs, localeId.value)), {
    immediate: true
});

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function selectConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig>): void {
    activeDataViewConfig.value =
        activeDataViewConfig.value === undefined
            ? {
                  id: '_new_',
                  label: { en: 'New Data View' },
                  description: { en: 'A new data view.' },
                  firstCreatedAt: null,
                  icon: null,
                  iconDark: null,
                  lastUpdatedAt: null,
                  status: null,
                  statusId: null,
                  typeId: 'dataView',
                  connectionId: connectionLocalisedConfig.id,
                  connectionNodeConfig: undefined,
                  previewConfig: undefined,
                  contentAuditConfig: undefined,
                  relationshipsAuditConfig: undefined
              }
            : {
                  ...activeDataViewConfig.value,
                  connectionId: connectionLocalisedConfig.id,
                  connectionNodeConfig: undefined,
                  previewConfig: undefined,
                  contentAuditConfig: undefined,
                  relationshipsAuditConfig: undefined
              };
    router.replace({ query: { ...route.query, conId: connectionLocalisedConfig.id } });
}
</script>

<template>
    <GridDetailPanel v-model="activeConnectionConfig" :data-source="dataSource" enable-add-action max-detail-width="400px" @select="selectConnection">
        <template #list-item-default="{ item }">
            <Card v-if="item" :icon="item.icon ?? undefined" :label="item.label" />
        </template>

        <template #list-item-compact="{ item }">
            <Tile v-if="item" :label="item.label" />
        </template>

        <template #detail="{ item }">
            <SelectConnectionForm :connection-localised-config="item" @submit="$emit('step-completed', stepLocalisedConfig)" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connection from the list on the left.'" />
        </template>
    </GridDetailPanel>
</template>
