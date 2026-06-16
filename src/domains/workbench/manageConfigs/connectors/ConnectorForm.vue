<script setup lang="ts">
// External Dependencies & Registrations
import { ArrowBigRightIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import type { EngineAuthActionOptions } from '@dpuse/dpuse-shared/engine';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local (App) Framework
import { accountId } from '@/state/session';
import T from './ConnectorForm.json';
import { t } from '@/state/locale';
import { useEngine } from '@/services/useEngine';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const { connectorLocalisedConfig } = defineProps<{ connectorLocalisedConfig: LocalisedConfig<ConnectorConfig> }>();
const emit = defineEmits<{ submit: [] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── UI Event Handlers ────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    emit('submit');
    await router.push({ name: 'selectItem', query: { ...route.query, wbView: 'selectItem' } });
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function testAuth(): Promise<void> {
    if (connectorLocalisedConfig == null) return;
    const { processRequest } = await useEngine();
    (await processRequest('authenticateConnection', connectorLocalisedConfig, {
        accountId: accountId.value,
        windowCenterX: screen.width / 2,
        windowCenterY: screen.height / 2
    })) as EngineAuthActionOptions;
}
</script>

<template>
    <form class="relative flex h-full flex-col pl-4" data-region="SelectConnectionForm" @submit.prevent="handleSubmit">
        <ScrollArea class="flex-1" scroll-area-padding="screen">
            <div class="flex flex-col gap-y-4 pt-2">
                {{ connectorLocalisedConfig?.description }}

                <div>
                    <div><strong>Id:</strong> {{ connectorLocalisedConfig?.id }}</div>
                    <div><strong>Category Id:</strong> {{ connectorLocalisedConfig?.categoryId }}</div>
                    <div><strong>Status Id:</strong> {{ connectorLocalisedConfig?.statusId }}</div>
                    <div><strong>Status Id:</strong> {{ connectorLocalisedConfig?.statusId }}</div>
                    <div><strong>Type Id:</strong> {{ connectorLocalisedConfig?.typeId }}</div>
                    <div><strong>Type Id:</strong> {{ connectorLocalisedConfig?.typeId }}</div>
                    <div><strong>Usage Id:</strong> {{ connectorLocalisedConfig?.usageId }}</div>
                    <div><strong>Version:</strong> {{ connectorLocalisedConfig?.version }}</div>
                </div>

                <Button @click="testAuth">Auth</Button>

                <!-- <div>
                    <strong>Connection:</strong>
                    <div>id: {{ connectorLocalisedConfig.id }}</div>
                    <div>label: {{ connectorLocalisedConfig.label }}</div>
                    <div>description: {{ connectorLocalisedConfig.description }}</div>
                    <div>notation: {{ connectorLocalisedConfig.notation }}</div>
                    <div>authorisation: {{ connectorLocalisedConfig.authorisation }}</div>
                    <div>firstCreatedAt: {{ connectorLocalisedConfig.firstCreatedAt }}</div>
                    <div>icon: {{ connectorLocalisedConfig.icon != null }}</div>
                    <div>iconDark: {{ connectorLocalisedConfig.iconDark != null }}</div>
                    <div>iconNeutral: {{ connectorLocalisedConfig.iconNeutral != null }}</div>
                    <div>lastUpdatedAt: {{ connectorLocalisedConfig.lastUpdatedAt }}</div>
                    <div>lastVerifiedAt: {{ connectorLocalisedConfig.lastVerifiedAt }}</div>
                    <div>status: {{ connectorLocalisedConfig.status }}</div>
                    <div>statusId: {{ connectorLocalisedConfig.statusId }}</div>
                    <div>typeId: {{ connectorLocalisedConfig.typeId }}</div>
                </div> -->

                <div>
                    <strong>Connector:</strong>
                    <div>id: {{ connectorLocalisedConfig.id }}</div>
                    <div>label: {{ connectorLocalisedConfig.label }}</div>
                    <div>description: {{ connectorLocalisedConfig?.description }}</div>
                    <div>category: {{ connectorLocalisedConfig?.category }}</div>
                    <div>categoryId: {{ connectorLocalisedConfig?.categoryId }}</div>
                    <div>firstCreatedAt: {{ connectorLocalisedConfig.firstCreatedAt }}</div>
                    <div>icon: {{ connectorLocalisedConfig.icon != null }}</div>
                    <div>iconDark: {{ connectorLocalisedConfig.iconDark != null }}</div>
                    <div>implementations: {{ connectorLocalisedConfig?.implementations }}</div>
                    <div>operations: {{ connectorLocalisedConfig?.operations }}</div>
                    <div>lastUpdatedAt: {{ connectorLocalisedConfig.lastUpdatedAt }}</div>
                    <!-- <div>lastVerifiedAt: {{ connectorLocalisedConfig.lastVerifiedAt }}</div> -->
                    <div>status: {{ connectorLocalisedConfig?.status }}</div>
                    <div>statusId: {{ connectorLocalisedConfig?.statusId }}</div>
                    <div>typeId: {{ connectorLocalisedConfig?.typeId }}</div>
                    <div>usageId: {{ connectorLocalisedConfig?.usageId }}</div>
                    <div>vendorAccountURL: {{ connectorLocalisedConfig?.vendorAccountURL }}</div>
                    <div>vendorDocumentationURL: {{ connectorLocalisedConfig?.vendorDocumentationURL }}</div>
                    <div>vendorHomeURL: {{ connectorLocalisedConfig?.vendorHomeURL }}</div>
                    <div>version: {{ connectorLocalisedConfig?.version }}</div>
                </div>
            </div>
        </ScrollArea>
    </form>
</template>
