<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectionConfig, EngineAuthActionOptions, LocalisedConfig } from '@dpuse/dpuse-shared';
import { constructConnectorCategoryConfig, getComponentStatus } from '@dpuse/dpuse-shared';

// ── Local Framework
import { accountId } from '@/state/session';
import { establishEngineWorker } from '@/services/engine';
import { ignoreReportedNavigationFailure } from '@/router';
import { TEXT } from './SelectConnectionPanel_.json';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import StudioDetailLayout from '@/features/studio/_components/StudioDetailLayout.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { connectionLocalisedConfig } = defineProps<{ connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> }>();

defineEmits<{ close: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const connectorCategoryLabel = computed(() => constructConnectorCategoryConfig(connectionLocalisedConfig.connectorConfig.categoryId, localeId.value).label);
const connectorStatus = computed(() => (connectionLocalisedConfig.statusId ? getComponentStatus(connectionLocalisedConfig.statusId, localeId.value) : undefined));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSubmit(): void {
    void ignoreReportedNavigationFailure(router.push({ name: 'item', query: route.query }));
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function testAuth(): Promise<void> {
    const { processRequest } = await establishEngineWorker();
    (await processRequest('authenticateConnection', connectionLocalisedConfig, {
        accountId: accountId.value,
        windowCenterX: screen.width / 2,
        windowCenterY: screen.height / 2
    })) as EngineAuthActionOptions;
}
</script>

<template>
    <StudioDetailLayout data-region="SelectConnectionPanel">
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)" scroll-area-padding-left="1rem">
            <StudioDocumentPanel
                :icon="connectionLocalisedConfig.icon"
                :icon-dark="connectionLocalisedConfig.iconDark"
                :overline="t(TEXT, 'connections.label')"
                :title="connectionLocalisedConfig.label"
                @close="$emit('close')"
            >
                <template #tags>
                    <Tag :text="connectorCategoryLabel" />
                    <Tag :text="`v${connectionLocalisedConfig.connectorConfig.version}`" />
                    <!-- General availability has no label, so shows no tag. -->
                    <Tag v-if="connectorStatus?.label" :text="connectorStatus.label" :color="connectorStatus.color" />
                </template>

                <!-- Description -->
                <p v-if="connectionLocalisedConfig.description">{{ connectionLocalisedConfig.description }}</p>
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailLayout>

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

                <RectangleButton @click="testAuth">Auth</RectangleButton>

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
