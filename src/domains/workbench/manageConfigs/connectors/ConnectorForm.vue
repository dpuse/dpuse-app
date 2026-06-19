<script setup lang="ts">
// External Dependencies & Registrations
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
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
import Tag from '@/components/ui/Tag.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const { connectorLocalisedConfig } = defineProps<{ connectorLocalisedConfig: LocalisedConfig<ConnectorConfig> }>();
const emit = defineEmits<{ submit: [] }>();

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const USAGE_LABELS: Record<string, string> = {
    source: 'Source',
    destination: 'Destination',
    bidirectional: 'Bidirectional',
    unknown: 'Unknown'
};

const STATUS_COLORS: Record<string, 'amber' | 'green' | 'red'> = {
    generalAvailability: 'green',
    releaseCandidate: 'green',
    beta: 'amber',
    alpha: 'red',
    preAlpha: 'red',
    unavailable: 'red'
};

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
                <div class="flex flex-wrap gap-1.5">
                    <Tag :text="`v${connectorLocalisedConfig.version}`" />
                    <Tag :text="USAGE_LABELS[connectorLocalisedConfig.usageId] ?? connectorLocalisedConfig.usageId" />
                    <Tag
                        v-if="connectorLocalisedConfig.status"
                        :text="connectorLocalisedConfig.status.label"
                        :color="connectorLocalisedConfig.status.color === 'other' ? undefined : connectorLocalisedConfig.status.color"
                    />
                    <Tag v-else-if="connectorLocalisedConfig.statusId" :text="connectorLocalisedConfig.statusId" :color="STATUS_COLORS[connectorLocalisedConfig.statusId]" />
                </div>
                <code class="text-xs text-zinc-500 dark:text-zinc-400">{{ connectorLocalisedConfig.id }}</code>

                {{ connectorLocalisedConfig?.description }}

                <div><strong>Category Id:</strong> {{ connectorLocalisedConfig?.categoryId }}</div>

                <Button @click="testAuth">Auth</Button>

                <div>
                    <div>firstCreatedAt: {{ connectorLocalisedConfig.firstCreatedAt }}</div>
                    <div>icon: {{ connectorLocalisedConfig.icon != null }}</div>
                    <div>iconDark: {{ connectorLocalisedConfig.iconDark != null }}</div>
                    <div>implementations: {{ connectorLocalisedConfig?.implementations }}</div>
                    <div>operations: {{ connectorLocalisedConfig?.operations }}</div>
                    <div>lastUpdatedAt: {{ connectorLocalisedConfig.lastUpdatedAt }}</div>
                    <div>vendorAccountURL: {{ connectorLocalisedConfig?.vendorAccountURL }}</div>
                    <div>vendorDocumentationURL: {{ connectorLocalisedConfig?.vendorDocumentationURL }}</div>
                    <div>vendorHomeURL: {{ connectorLocalisedConfig?.vendorHomeURL }}</div>
                </div>
            </div>
        </ScrollArea>
    </form>
</template>
