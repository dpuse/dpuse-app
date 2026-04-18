<script setup lang="ts">
// External Dependencies
import { shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionLocalisedConfig } from '@dpuse/dpuse-shared/component/connector';

// App Framework
import { connectionConfigs } from '@/state/session';
import { activeConnectionConfig, activeDataViewConfig } from '@/state/establishDataViews';
import { localeId, localiseConfigs } from '@/translations';

// App Static Components
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

function selectConnection(connectionLocalisedConfigs: ConnectionLocalisedConfig): void {
    activeConnectionConfig.value = connectionLocalisedConfigs;
    if (activeDataViewConfig.value === undefined) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        activeDataViewConfig.value = { id: '_new_', label: { en: '' }, connectionId: connectionLocalisedConfigs.id };
    } else {
        activeDataViewConfig.value.connectionId = connectionLocalisedConfigs.id;
    }
    router.replace({ query: { ...route.query, conId: connectionLocalisedConfigs.id } });
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
