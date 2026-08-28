<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';
import { type RouteRecordNameGeneric, useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import T from './ConnectionDialog.json';
import { viewportIsWide } from '@/state/appLayout';
import { configRetrievalSucceeded, connectorConfigs } from '@/state/session';
import { localeId, t } from '@/state/locale';

// ── Static Components
import AddConnectionForm from './AddConnectionForm.vue';
import ConfigCard from '@/components/ui/ConfigCard.vue';
import ConfigIcon from '@/components/ui/ConfigIcon.vue';
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';
import ErrorBoundary from '@/components/ui/error/ErrorBoundary.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import StepActionButton from '@/components/ui/button/StepActionButton.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

interface OptionLocalisedConfig {
    id: string;
    type?: 'label';
    icon?: string;
    label: string;
    title?: string;
    isDestructive?: boolean;
}
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

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

const activeConnectorConfig = shallowRef<LocalisedConfig<ConnectorConfig> | undefined>();
const activeOptionConfig = shallowRef<OptionLocalisedConfig | undefined>(initialiseActiveOptionConfig(route.name)); // TODO: Use route to set this!
const connectorLocalisedConfigs = shallowRef<LocalisedConfig<ConnectorConfig>[]>([]);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectorConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectorConfig>>>(() => ({
    rowCount: configRetrievalSucceeded.value ? connectorLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<ConnectorConfig>[] }> => Promise.resolve({ rows: connectorLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(connectorConfigs, (newConnectorConfigs) => (connectorLocalisedConfigs.value = localiseConfigs<ConnectorConfig>(newConnectorConfigs, localeId.value, true)), {
    immediate: true
});

watch(viewportIsWide, (isWide) => {
    if (isWide && !activeOptionConfig.value) activeOptionConfig.value = OPTION_CONFIGS[1];
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleCommitDetail(): void {
    const query = { ...route.query };
    delete query.dlg;
    void router.push({ query }).catch(() => {
        // Already reported by 'router.onError'.
    });
}

function handleSelectConnector(connectorLocalisedConfig: LocalisedConfig<ConnectorConfig> | undefined): void {
    activeConnectorConfig.value = connectorLocalisedConfig;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

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
    <DialogHeader class="flex-none" :title="t(T, 'Manage_Connection')" />

    <GridDetailPanel :active-item="activeConnectorConfig" class="flex-1" :data-source="connectorConfigsDataSource" @select="handleSelectConnector">
        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :config="item" />
        </template>

        <template #detail="{ item }">
            <div class="ml-4 flex h-10 flex-none items-center gap-x-1 border-b border-separator">
                <ConfigIcon class="mt-1 size-7" :icon="item.icon" :icon-dark="item.iconDark" />
                <span class="ml-1 min-w-0 truncate">{{ item.label }}</span>
            </div>

            <div class="relative min-h-0 flex-1">
                <ErrorBoundary name="ConnectionDetail">
                    <AddConnectionForm :connector-localised-config="item" />
                    <StepActionButton label="Select" @commit="handleCommitDetail" />
                </ErrorBoundary>
            </div>
        </template>
    </GridDetailPanel>
</template>
