<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { connectionConfigs } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';

// ── Local Components - Static
import Card from '@/components/ui/Card.vue';
import ConnectionForm from './ConnectionForm.vue';
import DetailActionBar from '@/components/framework/gridDetailPanel/DetailActionBar.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConnectionConfig = shallowRef<LocalisedConfig<ConnectionConfig> | undefined>();
const connectionLocalisedConfigs = shallowRef<LocalisedConfig<ConnectionConfig>[]>([]);

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionConfig>>>(() => ({
    rowCount: connectionLocalisedConfigs.value.length,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<ConnectionConfig>[] }> => Promise.resolve({ rows: connectionLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(connectionConfigs, (newConnectionConfigs) => (connectionLocalisedConfigs.value = localiseConfigs<ConnectionConfig>(newConnectionConfigs, localeId.value, true)), {
    immediate: true
});

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
            <Card v-if="item" :icon="item.icon ?? undefined" :icon-dark="item.iconDark ?? undefined" :label="item.label" />
        </template>

        <template #detail="{ item, clear }">
            <div class="relative flex min-h-0 flex-1 flex-col">
                <ConnectionForm :connection-localised-config="item" />
                <DetailActionBar class="absolute right-4 bottom-(--safe-bottom-offset)" @clear="clear" @commit="handleCommitDetail" />
            </div>
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connection from the list.'" />
        </template>
    </GridDetailPanel>
</template>
