<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local (App) Framework
import { connectorConfigs } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';

// ── Local Components - Static
import Card from '@/components/ui/Card.vue';
import ConnectorForm from './ConnectorForm.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConnectorConfig = shallowRef<LocalisedConfig<ConnectorConfig> | undefined>();
const connectorLocalisedConfigs = shallowRef<LocalisedConfig<ConnectorConfig>[]>([]);
const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectorConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectorConfig>>>(() => ({
    rowCount: connectorLocalisedConfigs.value.length,
    getRows: (start, end): Promise<LocalisedConfig<ConnectorConfig>[]> => Promise.resolve(connectorLocalisedConfigs.value.slice(start, end))
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(connectorConfigs, (newConnectorConfigs) => (connectorLocalisedConfigs.value = localiseConfigs<ConnectorConfig>(newConnectorConfigs, localeId.value, true)), {
    immediate: true
});

// ── UI Event Handlers ────────────────────────────────────────────────────────────────────────────────────────────────

function handleCommitDetail(): void {
    router.push({ name: 'selectItem', query: { ...route.query, wbView: 'selectItem' } });
}

function handleSelectConnection(connectionLocalisedConfig: LocalisedConfig<ConnectorConfig> | undefined): void {
    activeConnectorConfig.value = connectionLocalisedConfig;
}

type ItemAction = { id: string; label: string };
const ITEM_ACTIONS: ItemAction[] = [{ id: 'addConnection', label: 'Add Connection' }];
const activeItemAction = ref<ItemAction | undefined>();

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
    application: 'Application',
    curatedDataset: 'Curated Dataset',
    database: 'Database',
    fileStore: 'File Store'
};

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function getCategoryConnectorLabel(categoryId: string): string {
    return `${CATEGORY_LABELS[categoryId] ?? categoryId} Connector`;
}
</script>

<template>
    <GridDetailPanel
        v-model:active-item-action="activeItemAction"
        :active-item="activeConnectorConfig"
        :data-source="connectorConfigsDataSource"
        :item-actions="ITEM_ACTIONS"
        max-detail-width="400px"
        @commit-detail="handleCommitDetail"
        @select="handleSelectConnection"
    >
        <template #detail-header="{ item }">
            <div class="dpuse-text ml-4 py-4">
                <div class="text-sm leading-tight text-muted">{{ getCategoryConnectorLabel(item.categoryId) }}</div>
                <div class="mt-1.5 flex items-center gap-x-1.5">
                    <div v-if="item.icon != null || item.iconDark != null" class="flex-none">
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <div v-if="item.icon != null" aria-hidden="true" class="flex size-7 items-center dark:hidden" v-html="item.icon" />
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <div aria-hidden="true" class="hidden size-7 items-center dark:flex" v-html="item.iconDark ?? item.icon ?? ''" />
                    </div>
                    <h2>{{ item.label }}</h2>
                </div>
            </div>
        </template>

        <template #grid-item="{ item }">
            <Card v-if="item" :icon="item.icon ?? undefined" :icon-dark="item.iconDark ?? undefined" :icon-neutral="item.iconNeutral ?? undefined" :label="item.label" />
        </template>

        <template #detail="{ item }">
            <ConnectorForm :connector-localised-config="item" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connector from the list on the left.'" />
        </template>
    </GridDetailPanel>
</template>
