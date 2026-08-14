<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ExternalLinkIcon, GlobeIcon, InfoIcon, UserRoundIcon } from '@lucide/vue';

// ── DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { constructConnectorCategoryConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import T from './ConnectorForm.json';
import { t } from '@/state/locale';

// ── Local Components - Static
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import ScrollArea from '@/components/ui/ScrollArea2.vue';
import StudioDocumentPanel from '../../StudioDocumentPanel.vue';
import StudioDetailPanel from '../../StudioDetailPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { connectorLocalisedConfig } = defineProps<{ connectorLocalisedConfig: LocalisedConfig<ConnectorConfig> }>();
defineEmits<{ clear: [] }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const AUTH_METHOD_DESCRIPTIONS: Record<string, string> = {
    apiKey: 'API Key',
    oAuth2: "Requires OAuth 2.0 authentication for each account connected; access is scoped to that account's files and folders only.",
    none: 'Does not require authentication and can be used without creating a DPUse Account. Only a single connection is supported.'
};

const CONNECTOR_USAGE_DESCRIPTIONS: Record<string, string> = {
    bidirectional: 'This connector supports both sourcing and delivering data.',
    destination: 'This connector is used exclusively for delivering data.',
    source: 'This connector is used exclusively for sourcing data.',
    unknown: 'The usage for this connector has not yet been determined.'
};

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const authMethods = computed(() => [
    ...new Set(
        Object.values(connectorLocalisedConfig.implementations)
            .map((impl) => impl.authMethodId)
            .filter((id) => id !== 'disabled')
    )
]);
const connectorStatus = computed(() => (connectorLocalisedConfig.statusId ? getComponentStatus(connectorLocalisedConfig.statusId) : undefined));
</script>

<template>
    <StudioDetailPanel data-region="ConnectorPanel">
        <ScrollArea scroll-area-padding="screen">
            <StudioDocumentPanel :overline="'Connectors'" :title="connectorLocalisedConfig.label" @clear="$emit('clear')">
                <!-- Tags -->
                <div class="mt-3 mb-6 flex flex-wrap gap-1.5">
                    <Tag :text="connectorLocalisedConfig.categoryId" />
                    <Tag :text="`v${connectorLocalisedConfig.version}`" />
                    <Tag v-if="connectorStatus" :text="connectorLocalisedConfig.statusId ?? ''" :color="connectorStatus.color" />
                </div>

                <!-- Description -->
                <p>{{ connectorLocalisedConfig.description }}</p>

                <p>{{ CONNECTOR_USAGE_DESCRIPTIONS[connectorLocalisedConfig.usageId ?? 'unknown'] }}</p>

                <!-- Authentication -->
                <h2>{{ t(T, 'Authentication') }}</h2>
                <p v-for="method in authMethods" :key="method">
                    {{ AUTH_METHOD_DESCRIPTIONS[method] ?? method }}
                </p>

                <!-- Connections -->
                <h2>Connections</h2>

                <!-- Links -->
                <h2>{{ t(T, 'Links') }}</h2>
                <ul>
                    <li v-if="connectorLocalisedConfig.vendorHomeURL">
                        <a :href="connectorLocalisedConfig.vendorHomeURL" class="inline-flex items-center gap-x-1 hover:underline" target="_blank" rel="noopener noreferrer">
                            <GlobeIcon class="size-4" /> {{ connectorLocalisedConfig.label }} Website
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li v-if="connectorLocalisedConfig.vendorDocumentationURL">
                        <a
                            :href="connectorLocalisedConfig.vendorDocumentationURL"
                            class="inline-flex items-center gap-x-1 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <InfoIcon class="size-4" /> {{ connectorLocalisedConfig.label }} Documentation
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li v-if="connectorLocalisedConfig.vendorAccountURL">
                        <a :href="connectorLocalisedConfig.vendorAccountURL" class="inline-flex items-center gap-x-1 hover:underline" target="_blank" rel="noopener noreferrer">
                            <UserRoundIcon class="size-4" /> {{ connectorLocalisedConfig.label }} Sign in
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li>
                        <a
                            :href="`https://github.com/dpuse/${connectorLocalisedConfig.id}`"
                            class="inline-flex items-center gap-x-1 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <GitHubLogo class="size-4" />
                            {{ t(T, 'GitHub_repository') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>
                </ul>
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailPanel>
</template>

<style scoped>
ul {
    list-style: none;
    padding-left: 0;
}
</style>
