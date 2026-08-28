<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';
import { t } from '@/state/locale';

// ── Static Components
import ModuleLinksPanel from '@/studio/manageConfig/components/ModuleLinksPanel.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import StudioDetailPanel from '@/studio/components/StudioDetailPanel.vue';
import StudioDocumentPanel from '@/studio/components/StudioDocumentPanel.vue';
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
    Authentication: { en: 'Authentication', es: 'Autenticación' },
    Connections: { en: 'Connections', es: 'Conexiones' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig>;
    connectorLocalisedConfig: LocalisedConfig<ConnectorConfig>;
}
const { activeConfigOptionConfig, connectorLocalisedConfig } = defineProps<Properties>();

defineEmits<{ clear: []; close: [] }>();

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
        <ScrollArea scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel
                :icon="connectorLocalisedConfig.icon"
                :icon-dark="connectorLocalisedConfig.iconDark"
                :overline="activeConfigOptionConfig.label"
                :title="connectorLocalisedConfig.label"
                @clear="$emit('clear')"
                @close="$emit('close')"
            >
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
                <h2>{{ t(T, 'Connections') }}</h2>

                <!-- Links -->
                <ModuleLinksPanel :localised-config="connectorLocalisedConfig" />
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailPanel>
</template>
