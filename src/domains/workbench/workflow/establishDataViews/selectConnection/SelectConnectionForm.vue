<script setup lang="ts">
// External Dependencies
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local (App) Framework
import T from './SelectConnectionForm.json';
import { t } from '@/state/locale';

// Local Components - Static
import FloatingButton from '@/components/ui/button/FloatingButton.vue';
import ScrollArea from '@/components/ui/scrollArea/ScrollArea.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { connectionLocalisedConfig } = defineProps<{ connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> }>();
const emit = defineEmits<{ submit: [] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    emit('submit');
    await router.push({ name: 'selectNode', query: { ...route.query, wbView: 'selectNode' } });
}

// async function testAuth(): Promise<void> {
//     if (connectionLocalisedConfig == null || connectionLocalisedConfig == null) return;
//     const { processRequest } = await useEngine();
//     (await processRequest('authenticateConnection', connectionLocalisedConfig, {
//         accountId: "JMT's Account",
//         windowCenterX: screen.width / 2,
//         windowCenterY: screen.height / 2
//     })) as EngineAuthActionOptions;
// }
</script>

<template>
    <form class="relative flex h-full flex-col pl-4" @submit.prevent="handleSubmit">
        <ScrollArea class="flex flex-1 flex-col">
            <strong>Connection:</strong>
            <div>id: {{ connectionLocalisedConfig.id }}</div>
            <div>label: {{ connectionLocalisedConfig.label }}</div>
            <div>description: {{ connectionLocalisedConfig.description }}</div>
            <div>notation: {{ connectionLocalisedConfig.notation }}</div>
            <div>authorisation: {{ connectionLocalisedConfig.authorisation }}</div>
            <div>firstCreatedAt: {{ connectionLocalisedConfig.firstCreatedAt }}</div>
            <div>icon: {{ connectionLocalisedConfig.icon != null }}</div>
            <div>iconDark: {{ connectionLocalisedConfig.iconDark != null }}</div>
            <div>lastUpdatedAt: {{ connectionLocalisedConfig.lastUpdatedAt }}</div>
            <div>lastVerifiedAt: {{ connectionLocalisedConfig.lastVerifiedAt }}</div>
            <div>status: {{ connectionLocalisedConfig.status }}</div>
            <div>statusId: {{ connectionLocalisedConfig.statusId }}</div>
            <div>typeId: {{ connectionLocalisedConfig.typeId }}</div>
            <strong>Connector:</strong>
            <div>id: {{ connectionLocalisedConfig.connectorConfig.id }}</div>
            <div>label: {{ connectionLocalisedConfig.connectorConfig.label }}</div>
            <div>description: {{ connectionLocalisedConfig?.connectorConfig.description }}</div>
            <div>category: {{ connectionLocalisedConfig?.connectorConfig.category }}</div>
            <div>categoryId: {{ connectionLocalisedConfig?.connectorConfig.categoryId }}</div>
            <div>firstCreatedAt: {{ connectionLocalisedConfig.firstCreatedAt }}</div>
            <div>icon: {{ connectionLocalisedConfig.icon != null }}</div>
            <div>iconDark: {{ connectionLocalisedConfig.iconDark != null }}</div>
            <div>implementations: {{ connectionLocalisedConfig?.connectorConfig.implementations }}</div>
            <div>operations: {{ connectionLocalisedConfig?.connectorConfig.operations }}</div>
            <div>lastUpdatedAt: {{ connectionLocalisedConfig.lastUpdatedAt }}</div>
            <div>lastVerifiedAt: {{ connectionLocalisedConfig.lastVerifiedAt }}</div>
            <div>status: {{ connectionLocalisedConfig?.connectorConfig.status }}</div>
            <div>statusId: {{ connectionLocalisedConfig?.connectorConfig.statusId }}</div>
            <div>typeId: {{ connectionLocalisedConfig?.connectorConfig.typeId }}</div>
            <div>usageId: {{ connectionLocalisedConfig?.connectorConfig.usageId }}</div>
            <div>vendorAccountURL: {{ connectionLocalisedConfig?.connectorConfig.vendorAccountURL }}</div>
            <div>vendorDocumentationURL: {{ connectionLocalisedConfig?.connectorConfig.vendorDocumentationURL }}</div>
            <div>vendorHomeURL: {{ connectionLocalisedConfig?.connectorConfig.vendorHomeURL }}</div>
            <div>version: {{ connectionLocalisedConfig?.connectorConfig.version }}</div>
        </ScrollArea>

        <FloatingButton class="right-(--safe-right-offset) bottom-(--safe-bottom-offset)" :type-label="'Connection'" variant="next" :verb="'Select'" @click="$emit('submit')" />
    </form>
</template>
