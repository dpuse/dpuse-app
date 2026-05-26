<script setup lang="ts">
// External Dependencies
import { type Component, computed, defineAsyncComponent, onErrorCaptured, ref, shallowRef, watch } from 'vue';
import { type RouteRecordNameGeneric, useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local (App) Framework
import { connectorConfigs } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import T from './ConnectionDialog.json';
import { viewportIsWide } from '@/state/appLayout';
import { localeId, t } from '@/state/locale';

// Local Components - Static
import AddConnectionForm from './AddConnectionForm.vue';
import Card from '@/components/ui/Card.vue';
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

type OptionLocalisedConfig = { id: string; type?: 'label'; icon?: string; label: string; title?: string; isDestructive?: boolean };
const OPTION_CONFIGS: OptionLocalisedConfig[] = [
    { id: 'profile', type: 'label', label: 'Profile' },
    { id: 'managePersonalDetails', icon: '', label: 'Personal details', title: 'Manage Personal Details' },
    { id: 'manageSubscription', icon: '', label: 'Subscription & billing' },
    { id: 'managePreferences', icon: '', label: 'Preferences' },
    { id: 'security', type: 'label', label: 'Security' },
    { id: 'manageAccess', icon: '', label: 'Access' },
    { id: 'manageSessions', icon: '', label: 'Active sessions' },
    { id: 'reviewActivity', icon: '', label: 'Recent activity' },
    { id: 'integrations', type: 'label', label: 'Integrations' },
    { id: 'manageDataServiceTokens', icon: '', label: 'Data service tokens' },
    { id: 'development', type: 'label', label: 'Development' },
    { id: 'generateToken', icon: '', label: 'API token' },
    { id: 'criticalActions', type: 'label', label: 'Critical Actions' },
    { id: 'deleteAccount', icon: '', label: 'Delete account', isDestructive: true }
];
const OPTION_COMPONENT_MAP: Record<string, Component> = {
    managePersonalDetails: defineAsyncComponent(() => import('./ManageConnectionPanel.vue'))
};

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const { close } = defineProps<{ close: () => void }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

const activeConnectorConfig = shallowRef<LocalisedConfig<ConnectorConfig> | undefined>();
const activeOptionConfig = shallowRef<OptionLocalisedConfig | undefined>(initialiseActiveOptionConfig(route.name)); // TODO: Use route to set this!
const connectorLocalisedConfigs = shallowRef<LocalisedConfig<ConnectorConfig>[]>([]);
const subPanelError = ref<unknown>(null);

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const connectorConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectorConfig>>>(() => ({
    rowCount: connectorLocalisedConfigs.value.length,
    getRows: (start, end): Promise<LocalisedConfig<ConnectorConfig>[]> => Promise.resolve(connectorLocalisedConfigs.value.slice(start, end))
}));

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onErrorCaptured((error) => {
    subPanelError.value = error;
    return false;
});

watch(connectorConfigs, (newConnectorConfigs) => (connectorLocalisedConfigs.value = localiseConfigs<ConnectorConfig>(newConnectorConfigs, localeId.value, true)), {
    immediate: true
});

watch(viewportIsWide, (isWide) => {
    if (isWide && !activeOptionConfig.value) activeOptionConfig.value = OPTION_CONFIGS[1];
});

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleCommitDetail(): void {
    close();
}

function handleSelectConnector(connectorLocalisedConfig: LocalisedConfig<ConnectorConfig> | undefined): void {
    activeConnectorConfig.value = connectorLocalisedConfig;
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function initialiseActiveOptionConfig(routeName: RouteRecordNameGeneric): OptionLocalisedConfig | undefined {
    if (routeName === 'account') {
        if (viewportIsWide.value) {
            return OPTION_CONFIGS[1];
        }
    } else {
        const activeOptionConfig = OPTION_CONFIGS.find((config) => config.id === route.name);
        if (!activeOptionConfig) {
            if (viewportIsWide.value) {
                return OPTION_CONFIGS[1];
            }
            return;
        }
        return activeOptionConfig;
    }
}
</script>

<template>
    <div class="flex min-h-0 flex-col" data-region="ConnectionDialog">
        <DialogHeader :title="t(T, 'Manage_Connection')" />

        <GridDetailPanel
            :active-item="activeConnectorConfig"
            class="flex-1"
            commit-variant="add"
            :data-source="connectorConfigsDataSource"
            @commit-detail="handleCommitDetail"
            @select="handleSelectConnector"
        >
            <template #grid-item="{ item }">
                <Card v-if="item" :icon="item.icon ?? undefined" :icon-dark="item.iconDark ?? undefined" :icon-neutral="item.iconNeutral ?? undefined" :label="item.label" />
            </template>

            <template #detail="{ item }">
                <AddConnectionForm :connector-localised-config="item" />
            </template>
        </GridDetailPanel>
    </div>
</template>
