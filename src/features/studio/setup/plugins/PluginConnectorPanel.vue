<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import { constructConnectorCategoryConfig } from '@dpuse/dpuse-shared';
import type { ConnectorConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { SetupOptionConfig } from '@/utilities/index.ts';
import { TEXT } from './PluginConnectorPanel_.json';
import { localeId, t } from '@/state/locale';

// ── Static Components
import PluginPanel from '@/features/studio/setup/plugins/_components/PluginPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// TODO: Need to support translations.
const AUTH_METHOD_DESCRIPTIONS: Record<string, string> = {
    apiKey: 'API Key',
    oAuth2: "Requires OAuth 2.0 authentication for each account connected; access is scoped to that account's files and folders only.",
    none: 'Does not require authentication and can be used without creating a DPUse Account. Only a single connection is supported.'
};

// TODO: Need to support translations.
const CONNECTOR_USAGE_DESCRIPTIONS: Record<string, string> = {
    bidirectional: 'This connector supports both sourcing and delivering data.',
    destination: 'This connector is used exclusively for delivering data.',
    source: 'This connector is used exclusively for sourcing data.',
    unknown: 'The usage for this connector has not yet been determined.'
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { pluginLocalisedConfig, setupOptionLocalisedConfig } = defineProps<{
    pluginLocalisedConfig: LocalisedConfig<ConnectorConfig>;
    setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig>;
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const authMethods = computed(() => [
    ...new Set(
        Object.values(pluginLocalisedConfig.implementations)
            .map((impl) => impl.authMethodId)
            .filter((id) => id !== 'disabled')
    )
]);
const connectorCategoryLabel = computed(() => constructConnectorCategoryConfig(pluginLocalisedConfig.categoryId, localeId.value).label);
</script>

<template>
    <!-- 'close' reaches 'PluginPanel' by attribute fallthrough, so this must stay single-root. -->
    <PluginPanel :plugin-localised-config="pluginLocalisedConfig" :setup-option-localised-config="setupOptionLocalisedConfig">
        <template #tags>
            <Tag :text="connectorCategoryLabel" />
        </template>

        <!-- Usage -->
        <p>{{ CONNECTOR_USAGE_DESCRIPTIONS[pluginLocalisedConfig.usageId ?? 'unknown'] }}</p>

        <!-- Authentication -->
        <h2>{{ t(TEXT, 'authentication.title') }}</h2>
        <p v-for="method in authMethods" :key="method">
            {{ AUTH_METHOD_DESCRIPTIONS[method] ?? method }}
        </p>

        <!-- Connections -->
        <h2>{{ t(TEXT, 'connections.title') }}</h2>
    </PluginPanel>
</template>
