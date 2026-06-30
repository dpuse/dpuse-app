<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import { constructConnectorCategoryConfig } from '@dpuse/dpuse-shared/component/module/connector';
import type { EngineAuthActionOptions } from '@dpuse/dpuse-shared/component/module/engine';
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local (App) Framework
import { accountId } from '@/state/session';
import T from './ConnectionForm.json';
import { t } from '@/state/locale';
import { useEngine } from '@/services/useEngine';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { connectionLocalisedConfig } = defineProps<{ connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> }>();
const emit = defineEmits<{ submit: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    emit('submit');
    await router.push({ name: 'selectItem', query: { ...route.query, wbView: 'selectItem' } });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function testAuth(): Promise<void> {
    if (connectionLocalisedConfig == null) return;
    const { processRequest } = await useEngine();
    (await processRequest('authenticateConnection', connectionLocalisedConfig, {
        accountId: accountId.value,
        windowCenterX: screen.width / 2,
        windowCenterY: screen.height / 2
    })) as EngineAuthActionOptions;
}

function getCategoryConnectorLabel(categoryId: string): string {
    return `${constructConnectorCategoryConfig(categoryId).label} Connection`;
}
</script>

<template>
    <form class="flex min-h-0 flex-1 flex-col pl-4" data-region="ConnectionForm" @submit.prevent="handleSubmit">
        <ScrollArea class="flex-1" scroll-area-padding="screen">
            <div class="dpuse-text flex flex-col gap-y-4 pt-4">
                <!-- Header -->
                <div>
                    <div class="text-sm leading-tight text-muted">{{ getCategoryConnectorLabel(connectionLocalisedConfig.connectorConfig.categoryId) }}</div>
                    <div class="flex items-center gap-x-1.5">
                        <div v-if="connectionLocalisedConfig.icon != null || connectionLocalisedConfig.iconDark != null">
                            <div
                                v-if="connectionLocalisedConfig.icon != null"
                                aria-hidden="true"
                                class="flex size-8 items-center dark:hidden"
                                v-html="connectionLocalisedConfig.icon"
                            />
                            <div
                                aria-hidden="true"
                                class="hidden size-8 items-center dark:flex"
                                v-html="connectionLocalisedConfig.iconDark ?? connectionLocalisedConfig.icon ?? ''"
                            />
                        </div>
                        <h1>{{ connectionLocalisedConfig.label }}</h1>
                    </div>
                </div>

                <!-- Description -->
                <p v-for="paragraph in connectionLocalisedConfig.description" :key="paragraph">{{ paragraph }}</p>

                <!-- Authentication -->
                <div class="flex flex-col gap-y-2">
                    <h3>{{ t(T, 'Authentication') }}</h3>

                    <Button class="max-w-40" @click="testAuth">Authenticate</Button>
                </div>

                <!-- Connector -->
                <div class="flex flex-col gap-y-2">
                    <h3>{{ t(T, 'Connector') }}</h3>
                </div>
                <!-- Tags -->
                <div class="flex flex-wrap gap-1.5">
                    <Tag :text="`v${connectionLocalisedConfig.connectorConfig.version}`" />
                    <Tag
                        v-if="connectionLocalisedConfig.status"
                        :text="connectionLocalisedConfig.status.label"
                        :color="connectionLocalisedConfig.status.color === 'other' ? undefined : connectionLocalisedConfig.status.color"
                    />
                    <Tag
                        v-else-if="connectionLocalisedConfig.statusId"
                        :text="connectionLocalisedConfig.statusId"
                        :color="getComponentStatus(connectionLocalisedConfig.statusId).color === 'other' ? undefined : getComponentStatus(connectionLocalisedConfig.statusId).color"
                    />
                </div>

                <!-- Links -->

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
                    <div>iconNeutral: {{ connectionLocalisedConfig.iconNeutral != null }}</div>
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
    </form>
</template>
