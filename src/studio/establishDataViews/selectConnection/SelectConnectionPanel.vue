<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { EngineAuthActionOptions } from '@dpuse/dpuse-shared/component/module/engine';
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { accountId } from '@/state/session';
import { useEngine } from '@/services/useEngine';

// ── Static Components
import ScrollArea from '@/components/ui/ScrollArea.vue';
import StudioDetailPanel from '../../StudioDetailPanel.vue';
import StudioDocumentPanel from '../../StudioDocumentPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { connectionLocalisedConfig } = defineProps<{ connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> }>();
defineEmits<{ close: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const connectorStatus = computed(() => (connectionLocalisedConfig.statusId ? getComponentStatus(connectionLocalisedConfig.statusId) : undefined));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSubmit(): void {
    void router.push({ name: 'selectItem', query: { ...route.query, sView: 'selectItem' } });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function testAuth(): Promise<void> {
    const { processRequest } = await useEngine();
    (await processRequest('authenticateConnection', connectionLocalisedConfig, {
        accountId: accountId.value,
        windowCenterX: screen.width / 2,
        windowCenterY: screen.height / 2
    })) as EngineAuthActionOptions;
}
</script>

<template>
    <StudioDetailPanel data-region="SelectConnectionPanel">
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel overline="Connections" :title="connectionLocalisedConfig.label" @close="$emit('close')">
                <!-- Tags -->
                <div class="mt-3 mb-6 flex flex-wrap gap-1.5">
                    <Tag :text="connectionLocalisedConfig.connectorConfig.categoryId" />
                    <Tag :text="`v${connectionLocalisedConfig.connectorConfig.version}`" />
                    <Tag v-if="connectorStatus" :text="connectionLocalisedConfig.statusId ?? ''" :color="connectorStatus.color" />
                </div>

                <!-- Description -->
                <p v-if="connectionLocalisedConfig.description">{{ connectionLocalisedConfig.description }}</p>
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailPanel>

    <!-- <form class="relative flex h-full flex-col pl-4" data-region="SelectConnectionPanel" @submit.prevent="handleSubmit">
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <div class="flex flex-col gap-y-4 pt-2">
                {{ connectionLocalisedConfig?.connectorConfig.description.en }}

                <div>
                    <div><strong>Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.id }}</div>
                    <div><strong>Category Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.categoryId }}</div>
                    <div><strong>Status Id:</strong> {{ connectionLocalisedConfig?.statusId }}</div>
                    <div><strong>Status Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.statusId }}</div>
                    <div><strong>Type Id:</strong> {{ connectionLocalisedConfig?.typeId }}</div>
                    <div><strong>Type Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.typeId }}</div>
                    <div><strong>Version:</strong> {{ connectionLocalisedConfig?.connectorConfig.version }}</div>
                </div>

                <Button @click="testAuth">Auth</Button>

                <div>
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
                </div>

                <div>
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
                    <div>actionNames: {{ connectionLocalisedConfig?.connectorConfig.actionNames }}</div>
                    <div>lastUpdatedAt: {{ connectionLocalisedConfig.lastUpdatedAt }}</div>
                    <div>lastVerifiedAt: {{ connectionLocalisedConfig.lastVerifiedAt }}</div>
                    <div>status: {{ connectionLocalisedConfig?.connectorConfig.status }}</div>
                    <div>statusId: {{ connectionLocalisedConfig?.connectorConfig.statusId }}</div>
                    <div>typeId: {{ connectionLocalisedConfig?.connectorConfig.typeId }}</div>
                    <div>vendorAccountURL: {{ connectionLocalisedConfig?.connectorConfig.vendorAccountURL }}</div>
                    <div>vendorDocumentationURL: {{ connectionLocalisedConfig?.connectorConfig.vendorDocumentationURL }}</div>
                    <div>vendorHomeURL: {{ connectionLocalisedConfig?.connectorConfig.vendorHomeURL }}</div>
                    <div>version: {{ connectionLocalisedConfig?.connectorConfig.version }}</div>
                </div>
            </div>
        </ScrollArea>
    </form> -->
</template>
