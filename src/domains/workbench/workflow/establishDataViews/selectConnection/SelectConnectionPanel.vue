<script setup lang="ts">
// External Dependencies
import { shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionLocalisedConfig } from '@dpuse/dpuse-shared/component/module/connector';

// Local Framework
import { connectionConfigs } from '@/state/session';
import { activeConnectionConfig, activeDataViewConfig } from '@/state/establishDataViews';
import { localeId, localiseConfigs } from '@/translations';

// Local Components - Static
import Card from '@/components/ui/card/Card.vue';
import GridDetailPanel from '@/components/layout/gridDetailPanel/GridDetailPanel.vue';
import SelectConnectionForm from './SelectConnectionForm.vue';
import type { TaskLocalisedConfig } from '../EstablishDataViewsLayout.vue';
import Tile from '@/components/ui/tile/Tile.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: TaskLocalisedConfig }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: TaskLocalisedConfig] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionLocalisedConfigs = shallowRef<ConnectionLocalisedConfig[]>([]);
const route = useRoute();
const router = useRouter();

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(connectionConfigs, (newConnectionConfigs) => (connectionLocalisedConfigs.value = localiseConfigs<ConnectionLocalisedConfig>(newConnectionConfigs, localeId.value)), {
    immediate: true
});

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function selectConnection(connectionLocalisedConfig: ConnectionLocalisedConfig): void {
    activeConnectionConfig.value = connectionLocalisedConfig;
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
    <GridDetailPanel :items="connectionLocalisedConfigs || []" max-detail-width="400px" @select-item="selectConnection($event)">
        <template #list-item-default="{ item }">
            <Card v-if="item" :label="item.label" />
        </template>

        <template #list-item-compact="{ item }">
            <Tile v-if="item" :label="item.label" />
        </template>

        <template #detail="{ item }">
            <SelectConnectionForm :connection-localised-config="item" @submit="$emit('task-completed', taskLocalisedConfig)" />
        </template>

        <template #no-selection>
            <div class="p-4">Select a connection...</div>
        </template>
    </GridDetailPanel>
</template>
