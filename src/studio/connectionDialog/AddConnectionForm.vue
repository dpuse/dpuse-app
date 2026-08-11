<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowBigRightIcon } from '@lucide/vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import type { EngineAuthActionOptions } from '@dpuse/dpuse-shared/component/module/engine';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { accountId } from '@/state/session';
import T from './AddConnectionForm.json';
import { t } from '@/state/locale';
import { useEngine } from '@/services/useEngine';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ScrollArea from '@/components/ui/ScrollArea2.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { connectorLocalisedConfig } = defineProps<{ connectorLocalisedConfig: LocalisedConfig<ConnectorConfig> }>();
const emit = defineEmits<{ submit: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    // emit('submit');
    // await router.push({ name: 'selectItem', query: { ...route.query, sView: 'selectItem' } });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// async function testAuth(): Promise<void> {
//     if (connectionLocalisedConfig == null) return;
//     const { processRequest } = await useEngine();
//     (await processRequest('authenticateConnection', connectionLocalisedConfig, {
//         accountId: accountId.value,
//         windowCenterX: screen.width / 2,
//         windowCenterY: screen.height / 2
//     })) as EngineAuthActionOptions;
// }
</script>

<template>
    <form class="relative flex h-full flex-col pl-4" data-region="AddConnectionForm" @submit.prevent="handleSubmit">
        <ScrollArea class="flex-1" scroll-area-padding="screen">
            <div class="flex flex-col gap-y-4 pt-2">
                {{ connectorLocalisedConfig.description }}

                <div>
                    <!-- <div><strong>Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.id }}</div>
                    <div><strong>Category Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.categoryId }}</div>
                    <div><strong>Status Id:</strong> {{ connectionLocalisedConfig?.statusId }}</div>
                    <div><strong>Status Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.statusId }}</div>
                    <div><strong>Type Id:</strong> {{ connectionLocalisedConfig?.typeId }}</div>
                    <div><strong>Type Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.typeId }}</div>
                    <div><strong>Version:</strong> {{ connectionLocalisedConfig?.connectorConfig.version }}</div> -->
                </div>

                <!-- <Button @click="testAuth">Auth</Button> -->

                <div>
                    <!-- <strong>Connection:</strong>
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
                    <div>typeId: {{ connectionLocalisedConfig.typeId }}</div> -->
                </div>

                <div>
                    <strong>Connector:</strong>
                    <div>id: {{ connectorLocalisedConfig.id }}</div>
                    <div>label: {{ connectorLocalisedConfig.label }}</div>
                    <div>description: {{ connectorLocalisedConfig.description }}</div>
                    <div>category: {{ connectorLocalisedConfig.category }}</div>
                    <div>categoryId: {{ connectorLocalisedConfig.categoryId }}</div>
                    <div>firstCreatedAt: {{ connectorLocalisedConfig.firstCreatedAt }}</div>
                    <div>icon: {{ connectorLocalisedConfig.icon != null }}</div>
                    <div>iconDark: {{ connectorLocalisedConfig.iconDark != null }}</div>
                    <div>implementations: {{ connectorLocalisedConfig.implementations }}</div>
                    <div>actions: {{ connectorLocalisedConfig.actionNames }}</div>
                    <div>lastUpdatedAt: {{ connectorLocalisedConfig.lastUpdatedAt }}</div>
                    <div>status: {{ connectorLocalisedConfig.status }}</div>
                    <div>statusId: {{ connectorLocalisedConfig.statusId }}</div>
                    <div>typeId: {{ connectorLocalisedConfig.typeId }}</div>
                    <div>vendorAccountURL: {{ connectorLocalisedConfig.vendorAccountURL }}</div>
                    <div>vendorDocumentationURL: {{ connectorLocalisedConfig.vendorDocumentationURL }}</div>
                    <div>vendorHomeURL: {{ connectorLocalisedConfig.vendorHomeURL }}</div>
                    <div>version: {{ connectorLocalisedConfig.version }}</div>
                </div>
            </div>
        </ScrollArea>

        <!-- <ActionBar class="absolute right-4 bottom-(--safe-bottom-offset)" commit-action-variant="select" @commit="handleSubmit" /> -->
    </form>
</template>
