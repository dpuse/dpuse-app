<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { configsAreRetrieved } from '@/state/session';
import { connectionLocalisedConfigs } from '@/state/dataViews';
import type { DataSource } from '@/composables/useDataWindow';

// ── Local Components - Static
import ConfigCard from '@/components/ui/ConfigCard.vue';
import ConnectionForm from './ConnectionForm.vue';
import GridDetailPanel from '@/components/ui/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import StepActionButton from '@/components/ui/button/StepActionButton.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConnectionConfig = shallowRef<LocalisedConfig<ConnectionConfig> | undefined>();

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionConfig>>>(() => ({
    rowCount: configsAreRetrieved.value ? connectionLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<ConnectionConfig>[] }> => Promise.resolve({ rows: connectionLocalisedConfigs.value.slice(start, end) })
}));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleAddConnection(): void {
    router.replace({ query: { ...route.query, dlg: 'connection' } });
}

function handleCommitDetail(): void {
    router.push({ name: 'selectItem', query: { ...route.query, sView: 'selectItem' } });
}

function handleSelectConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> | undefined): void {
    activeConnectionConfig.value = connectionLocalisedConfig;
}
</script>

<template>
    <GridDetailPanel
        :active-item="activeConnectionConfig"
        add-label="Connection"
        class="min-h-0 flex-1"
        :data-source="connectionConfigsDataSource"
        max-detail-width="650px"
        @add="handleAddConnection"
        @select="handleSelectConnection"
    >
        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :config="item" />
        </template>

        <template #detail="{ item, clear }">
            <div class="relative flex min-h-0 flex-1 flex-col">
                <ConnectionForm :connection-localised-config="item" />
                <StepActionButton label="Select" @commit="handleCommitDetail" />
            </div>
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connection from the list.'" />
        </template>
    </GridDetailPanel>
</template>
