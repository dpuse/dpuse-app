<script setup lang="ts">
// External Dependencies
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionLocalisedConfig } from '@dpuse/dpuse-shared/component/connector';

// Local Framework
import T from '@/translations/domains/workbench/workflow/establishDataViews/selectConnection/SelectConnectionForm.json';
import { t } from '@/translations';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ContentScroller from '~/src/components/layout/contentScroller/ContentScroller.vue';

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { connectionLocalisedConfig } = defineProps<{ connectionLocalisedConfig: ConnectionLocalisedConfig }>();

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
    <form class="flex h-full flex-col overflow-y-hidden" @submit.prevent="handleSubmit">
        <ContentScroller class="flex flex-1 flex-col px-4 pb-4">
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
        </ContentScroller>

        <div class="mx-4 flex flex-none justify-end border-t border-zinc-200 pt-4 pb-4 dark:border-zinc-700">
            <Button
                :class="connectionLocalisedConfig == null ? 'cursor-not-allowed opacity-50' : undefined"
                :disabled="connectionLocalisedConfig == null"
                type="submit"
                variant="primary"
            >
                {{ t(T, 'Next') }}
            </Button>
        </div>
    </form>
</template>
