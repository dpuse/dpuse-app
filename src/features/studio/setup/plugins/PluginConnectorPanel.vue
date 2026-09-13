<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { SetupOptionConfig } from '@/utilities/index.ts';
import { t } from '@/state/locale';

// ── Static Components
import PluginPanel from '@/features/studio/setup/plugins/_components/PluginPanel.vue';
import Tag from '@/components/ui/Tag.vue';

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

const T = {
    'authentication.title': { en: 'Authentication', es: 'Autenticación' },
    'connections.title': { en: 'Connections', es: 'Conexiones' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    config: LocalisedConfig<SetupOptionConfig>;
    localisedConfig: LocalisedConfig<ConnectorConfig>;
}
const { config, localisedConfig } = defineProps<Properties>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const authMethods = computed(() => [
    ...new Set(
        Object.values(localisedConfig.implementations)
            .map((impl) => impl.authMethodId)
            .filter((id) => id !== 'disabled')
    )
]);
</script>

<template>
    <!-- 'clear' and 'close' reach 'PluginPanel' by attribute fallthrough, so this must stay single-root. -->
    <PluginPanel :config="config" :localised-config="localisedConfig">
        <template #tags>
            <Tag :text="localisedConfig.categoryId" />
        </template>

        <!-- Usage -->
        <p>{{ CONNECTOR_USAGE_DESCRIPTIONS[localisedConfig.usageId ?? 'unknown'] }}</p>

        <!-- Authentication -->
        <h2>{{ t(T, 'authentication.title') }}</h2>
        <p v-for="method in authMethods" :key="method">
            {{ AUTH_METHOD_DESCRIPTIONS[method] ?? method }}
        </p>

        <!-- Connections -->
        <h2>{{ t(T, 'connections.title') }}</h2>
    </PluginPanel>
</template>
