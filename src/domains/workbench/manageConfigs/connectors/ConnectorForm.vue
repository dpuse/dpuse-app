<script setup lang="ts">
// External Dependencies & Registrations
import { computed } from 'vue';
import { ExternalLinkIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local (App) Framework
import T from './ConnectorForm.json';
import { t } from '@/state/locale';

// Local Components - Static
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

const AUTH_METHOD_LABELS: Record<string, string> = {
    apiKey: 'API Key',
    oAuth2: 'OAuth 2.0',
    none: 'No authentication required'
};

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const authMethods = computed(() => [
    ...new Set(
        Object.values(connectorLocalisedConfig.implementations)
            .map((impl) => impl.authMethodId)
            .filter((id) => id !== 'disabled')
    )
]);

const links = computed(() => {
    const result: { label: string; url: string }[] = [];
    if (connectorLocalisedConfig.vendorHomeURL != null) result.push({ label: t(T, 'Vendor_website'), url: connectorLocalisedConfig.vendorHomeURL });
    if (connectorLocalisedConfig.vendorDocumentationURL != null) result.push({ label: t(T, 'Vendor_documentation'), url: connectorLocalisedConfig.vendorDocumentationURL });
    if (connectorLocalisedConfig.vendorAccountURL != null) result.push({ label: t(T, 'Manage_account'), url: connectorLocalisedConfig.vendorAccountURL });
    return result;
});

// ── UI Event Handlers ────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    emit('submit');
    await router.push({ name: 'selectItem', query: { ...route.query, wbView: 'selectItem' } });
}
</script>

<template>
    <form class="relative flex h-full flex-col pl-4" data-region="ConnectorForm" @submit.prevent="handleSubmit">
        <ScrollArea class="flex-1" scroll-area-padding="screen">
            <div class="flex flex-col gap-y-5 pt-2">
                <!-- Tags -->
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

                <!-- Description -->
                <p>{{ connectorLocalisedConfig.description }}</p>

                <!-- Authentication -->
                <div v-if="authMethods.length > 0" class="flex flex-col gap-y-2">
                    <div class="text-sm font-medium text-emphasis">{{ t(T, 'Authentication') }}</div>
                    <ul class="flex flex-col gap-y-1">
                        <li v-for="method in authMethods" :key="method" class="text-sm text-muted">
                            {{ AUTH_METHOD_LABELS[method] ?? method }}
                        </li>
                    </ul>
                </div>

                <!-- Links -->
                <div v-if="links.length > 0" class="flex flex-col gap-y-2">
                    <div class="text-sm font-medium text-emphasis">{{ t(T, 'Links') }}</div>
                    <ul class="flex flex-col gap-y-1">
                        <li v-for="link in links" :key="link.url">
                            <a :href="link.url" class="inline-flex items-center gap-x-1 text-sm text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                                {{ link.label }}
                                <ExternalLinkIcon class="size-3" />
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </ScrollArea>
    </form>
</template>
