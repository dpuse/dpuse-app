<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local (App) Framework
import { connectionConfigs } from '@/state/session';
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';

// ── Local Components - Static
import Card from '@/components/ui/Card.vue';
import ConnectionForm from './ConnectionForm.vue';
import DetailActionBar from '@/components/framework/gridDetailPanel/DetailActionBar.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
// import type { TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

// const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

// defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConnectionConfig = shallowRef<LocalisedConfig<ConnectionConfig> | undefined>();
const connectionLocalisedConfigs = shallowRef<LocalisedConfig<ConnectionConfig>[]>([]);

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionConfig>>>(() => ({
    rowCount: connectionLocalisedConfigs.value.length,
    getRows: (start, end): Promise<LocalisedConfig<ConnectionConfig>[]> => Promise.resolve(connectionLocalisedConfigs.value.slice(start, end))
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(connectionConfigs, (newConnectionConfigs) => (connectionLocalisedConfigs.value = localiseConfigs<ConnectionConfig>(newConnectionConfigs, localeId.value, true)), {
    immediate: true
});

// ── UI Event Handlers ────────────────────────────────────────────────────────────────────────────────────────────────

function handleAddConnection(): void {
    router.replace({ query: { ...route.query, dlg: 'connection' } });
}

function handleCommitDetail(): void {
    router.push({ name: 'selectItem', query: { ...route.query, wbView: 'selectItem' } });
}

function handleSelectConnection(connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> | undefined): void {
    activeConnectionConfig.value = connectionLocalisedConfig;
}
</script>

<template>
    <!-- <GridDetailPanel
        :active-item="activeConnectionConfig"
        add-label="Connection"
        :data-source="connectionConfigsDataSource"
        max-detail-width="400px"
        @add="handleAddConnection"
        @commit-detail="handleCommitDetail"
        @select="handleSelectConnection"
    > -->
    <GridDetailPanel
        :active-item="activeConnectionConfig"
        add-label="Connection"
        :data-source="connectionConfigsDataSource"
        max-detail-width="400px"
        @add="handleAddConnection"
        @select="handleSelectConnection"
    >
        <template #grid-item="{ item }">
            <Card v-if="item" :icon="item.icon ?? undefined" :icon-dark="item.iconDark ?? undefined" :icon-neutral="item.iconNeutral ?? undefined" :label="item.label" />
        </template>

        <template #detail="{ item, clear }">
            <div class="ml-4 flex h-10 flex-none items-center gap-x-1 border-b border-separator">
                <div class="flex size-7 items-center justify-center">
                    <div v-if="item.icon" aria-hidden="true" class="block w-6 dark:hidden" v-html="item.icon || item.iconDark" />
                    <div v-if="item.icon" aria-hidden="true" class="hidden w-6 dark:block" v-html="item.iconDark || item.icon" />
                </div>
                <span class="ml-1 min-w-0 truncate">{{ item.label }}</span>
            </div>
            <div class="relative min-h-0 flex-1">
                <!-- <ConnectionForm :connection-localised-config="item" @submit="$emit('task-completed', taskLocalisedConfig)" /> -->
                <ConnectionForm :connection-localised-config="item" />
                <DetailActionBar class="absolute right-4 bottom-(--safe-bottom-offset)" @clear="clear" @commit="handleCommitDetail" />
            </div>
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a connection from the list on the left.'" />
        </template>
    </GridDetailPanel>
</template>
