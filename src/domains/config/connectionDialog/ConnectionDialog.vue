<script setup lang="ts">
// External Dependencies
import { ArrowBigLeftIcon, LoaderCircleIcon } from 'lucide-vue-next';
import { type Component, computed, defineAsyncComponent, onErrorCaptured, ref, shallowRef, watch } from 'vue';
import { type RouteRecordNameGeneric, useRoute } from 'vue-router';

// Local (App) Framework
import { displayIsWide } from '@/state/appLayout';
import { localeId, t } from '@/state/locale';
import T from './ConnectionDialog.json';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Card from '@/components/ui/card/Card.vue';
import ChunkLoadError from '@/components/layout/chunkLoadError/ChunkLoadError.vue';
import ListItemButton from '@/components/ui/button/ListItemButton.vue';
import { connectorConfigs } from '~/src/state/session';
import GridDetailPanel from '~/src/components/layout/gridDetailPanel/GridDetailPanel.vue';
import type { DataSource } from '~/src/composables/useDataWindow';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';

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

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

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

watch(displayIsWide, (isWide) => {
    if (isWide && !activeOptionConfig.value) activeOptionConfig.value = OPTION_CONFIGS[1];
});

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleBack(): void {
    activeOptionConfig.value = undefined;
}

function handleSelectConnection(connectorLocalisedConfig: LocalisedConfig<ConnectorConfig> | undefined): void {
    activeConnectorConfig.value = connectorLocalisedConfig;
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function initialiseActiveOptionConfig(routeName: RouteRecordNameGeneric): OptionLocalisedConfig | undefined {
    if (routeName === 'account') {
        if (displayIsWide.value) {
            return OPTION_CONFIGS[1];
        }
    } else {
        const activeOptionConfig = OPTION_CONFIGS.find((config) => config.id === route.name);
        if (!activeOptionConfig) {
            if (displayIsWide.value) {
                return OPTION_CONFIGS[1];
            }
            return;
        }
        return activeOptionConfig;
    }
}
</script>

<template>
    <div>
        <div class="border-separator mx-4 flex flex-none justify-start border-b py-4 text-lg font-light">{{ t(T, 'Manage_Connection') }}</div>

        <GridDetailPanel :active-item="activeConnectorConfig" :data-source="connectorConfigsDataSource" @select="handleSelectConnection">
            <template #list-item-default="{ item }">
                <Card v-if="item" :icon="item.icon ?? undefined" :icon-dark="item.iconDark ?? undefined" :icon-neutral="item.iconNeutral ?? undefined" :label="item.label" />
            </template>

            <template #detail="{ item }"> {{ item }} </template>
        </GridDetailPanel>
    </div>

    <!-- <div class="flex flex-1 overflow-y-hidden">
        <div v-if="displayIsWide || !activeOptionConfig" class="flex flex-1 flex-col gap-y-1 overflow-y-auto overscroll-y-none px-4 pb-6">
            <div class="flex flex-1 flex-col gap-y-1">
                 <template v-for="optionConfig in OPTION_CONFIGS" :key="optionConfig.id">
                    <div v-if="optionConfig.type === 'label'" class="text-muted mt-3 text-xs font-medium">{{ optionConfig.label }}</div>
                    <ListItemButton
                        v-else
                        class="inline-flex min-w-50 justify-start"
                        :is-active="route.name === optionConfig.id && displayIsWide"
                        :variant="optionConfig.isDestructive ? 'destructive' : 'neutral'"
                        @click="activeOptionConfig = optionConfig"
                    >
                        {{ optionConfig.label }}
                    </ListItemButton>
                </template>
                <template v-for="connectorConfig in connectorConfigs" :key="connectorConfig.id">
                    <div>{{ connectorConfig.label.en }}</div>
                </template>
            </div>
        </div>

        <div v-if="displayIsWide || activeOptionConfig" class="flex flex-1 flex-col px-4">
            <div class="border-separator flex h-12 flex-none items-center gap-x-1 border-b">
                <Button v-if="!displayIsWide" shape="icon" size="sm" @click="handleBack">
                    <ArrowBigLeftIcon stroke-width="1.25" />
                </Button>
                {{ activeOptionConfig!.title }}
            </div>

            <ChunkLoadError v-if="subPanelError" :error="subPanelError" chunk-name="account panel" class="flex-1" />
            <Suspense v-else>
                <template #default>
                    <component :is="OPTION_COMPONENT_MAP[activeOptionConfig?.id ?? '']" class="flex-1" />
                </template>
                <template #fallback>
                    <div class="flex flex-1 items-center justify-center">
                        <LoaderCircleIcon class="text-muted animate-spin" />
                    </div>
                </template>
            </Suspense>
        </div>
    </div> -->
    <!-- </div>
    </div> -->
</template>
