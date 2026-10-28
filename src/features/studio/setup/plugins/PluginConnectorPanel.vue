<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { ConnectorActionName, ConnectorConfig, LocaleLabel, LocalisedConfig } from '@dpuse/dpuse-shared';
import { constructConnectorCategoryConfig, constructConnectorItemTypeConfig, constructConnectorUsageConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { connectionLocalisedConfigs } from '@/state/configs';
import type { SetupOptionConfig } from '@/features/studio/setup/useSetupOptions';
import { TEXT } from './PluginConnectorPanel_.json';
import { localeId, t } from '@/state/locale';

// ── Static Components
import PluginPanel from '@/features/studio/setup/plugins/_components/PluginPanel.vue';
import StudioDocumentSection from '@/features/studio/_components/StudioDocumentSection.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ACTION_LABEL_KEYS: Record<ConnectorActionName, keyof typeof TEXT> = {
    abortOperation: 'action.abortOperation.label',
    auditObjectContent: 'action.auditObjectContent.label',
    closeStore: 'action.closeStore.label',
    createObject: 'action.createObject.label',
    describeConnection: 'action.describeConnection.label',
    dropObject: 'action.dropObject.label',
    findObject: 'action.findObject.label',
    getInfo: 'action.getInfo.label',
    getReadableStream: 'action.getReadableStream.label',
    getRecord: 'action.getRecord.label',
    listNodes: 'action.listNodes.label',
    loadObjectRecords: 'action.loadObjectRecords.label',
    openStore: 'action.openStore.label',
    previewObject: 'action.previewObject.label',
    queryRecords: 'action.queryRecords.label',
    removeRecords: 'action.removeRecords.label',
    retrieveChunks: 'action.retrieveChunks.label',
    retrieveRecords: 'action.retrieveRecords.label',
    upsertRecords: 'action.upsertRecords.label'
};

const SIGN_IN_LABEL_KEYS: Partial<Record<string, keyof typeof TEXT>> = {
    apiKey: 'signIn.apiKey.text',
    none: 'signIn.none.text',
    oAuth2: 'signIn.oAuth2.text'
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { pluginLocalisedConfig, setupOptionLocalisedConfig } = defineProps<{
    pluginLocalisedConfig: LocalisedConfig<ConnectorConfig>;
    setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig>;
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Details
const connectorCategoryLabel = computed(() => constructConnectorCategoryConfig(pluginLocalisedConfig.categoryId, localeId.value).label);
const connectorItemTypeLabel = computed(() => constructConnectorItemTypeConfig(pluginLocalisedConfig.itemTypeId, localeId.value).label);
const connectorUsageLabel = computed(() => constructConnectorUsageConfig(pluginLocalisedConfig.usageId ?? 'unknown', localeId.value).label);

// ── Authentication ─ One group of rows per way of connecting. An implementation switched off is left out. Its name only
// shows when there is more than one, because a lone implementation is just the connector.
const implementationRows = computed(() => {
    const implementations = Object.entries(pluginLocalisedConfig.implementations).filter(([, implementation]) => implementation.authMethodId !== 'disabled');
    return implementations.map(([id, implementation]) => {
        const signInLabelKey = SIGN_IN_LABEL_KEYS[implementation.authMethodId];
        const { maxConnectionCount } = implementation;
        return {
            id,
            label: implementations.length > 1 ? (resolveLabel(implementation.label) ?? id) : undefined,
            accountText: t(TEXT, implementation.authMethodId === 'none' ? 'account.notNeeded.text' : 'account.needed.text'), // Connectors with no sign-in are offered signed out too.
            connectionLimitText: maxConnectionCount == null || maxConnectionCount < 0 ? t(TEXT, 'connectionLimit.none.text') : String(maxConnectionCount), // A connector marks no limit with -1.
            signInText: signInLabelKey ? t(TEXT, signInLabelKey) : implementation.authMethodId
        };
    });
});

// ── Actions ─ In the order the connector lists them.
const actionLabels = computed(() => pluginLocalisedConfig.actionNames.map((actionName) => t(TEXT, ACTION_LABEL_KEYS[actionName])));

// ── Connections ─ The user's connections that use this connector.
const connectionLabels = computed(() => connectionLocalisedConfigs.value.filter((config) => config.connectorConfig.id === pluginLocalisedConfig.id).map((config) => config.label));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function resolveLabel(label: LocaleLabel | undefined): string | undefined {
    if (label == null) return;
    return label[localeId.value] ?? label.en;
}
</script>

<template>
    <!-- 'close' reaches 'PluginPanel' by attribute fallthrough, so this must stay single-root. -->
    <PluginPanel is-hideable :plugin-localised-config="pluginLocalisedConfig" :setup-option-localised-config="setupOptionLocalisedConfig">
        <!-- After the version: the connector rows the data view and connection documents show, and the ones only this
             page needs. -->
        <template #details>
            <dt class="text-muted">{{ t(TEXT, 'category.label') }}</dt>
            <dd class="m-0">{{ connectorCategoryLabel }}</dd>
            <dt class="text-muted">{{ t(TEXT, 'itemType.label') }}</dt>
            <dd class="m-0">{{ connectorItemTypeLabel }}</dd>
            <dt class="text-muted">{{ t(TEXT, 'usage.label') }}</dt>
            <dd class="m-0">{{ connectorUsageLabel }}</dd>
        </template>

        <!-- Lists laid out as the details list above: a line under every row except the last when a section follows. -->
        <StudioDocumentSection :title="t(TEXT, 'authentication.title')">
            <dl
                class="grid grid-cols-[minmax(7.5rem,max-content)_1fr] text-sm *:border-b *:border-separator *:py-1 [&:is(:last-child,:has(+section))>:nth-last-child(-n+2)]:border-b-0 [&>dt]:pr-4"
            >
                <template v-for="implementationRow in implementationRows" :key="implementationRow.id">
                    <template v-if="implementationRow.label">
                        <dt class="text-muted">{{ t(TEXT, 'implementation.label') }}</dt>
                        <dd class="m-0 font-medium">{{ implementationRow.label }}</dd>
                    </template>
                    <dt class="text-muted">{{ t(TEXT, 'signIn.label') }}</dt>
                    <dd class="m-0">{{ implementationRow.signInText }}</dd>
                    <dt class="text-muted">{{ t(TEXT, 'account.label') }}</dt>
                    <dd class="m-0">{{ implementationRow.accountText }}</dd>
                    <dt class="text-muted">{{ t(TEXT, 'connectionLimit.label') }}</dt>
                    <dd class="m-0">{{ implementationRow.connectionLimitText }}</dd>
                </template>
            </dl>
        </StudioDocumentSection>

        <StudioDocumentSection :title="t(TEXT, 'actions.title')">
            <ul v-if="actionLabels.length > 0" class="text-sm *:border-b *:border-separator *:py-1 [&:is(:last-child,:has(+section))>:last-child]:border-b-0">
                <li v-for="actionLabel in actionLabels" :key="actionLabel">{{ actionLabel }}</li>
            </ul>
            <p v-else class="text-muted">{{ t(TEXT, 'actions.none.text') }}</p>
        </StudioDocumentSection>

        <StudioDocumentSection :title="t(TEXT, 'connections.title')">
            <ul v-if="connectionLabels.length > 0" class="text-sm *:border-b *:border-separator *:py-1 [&:is(:last-child,:has(+section))>:last-child]:border-b-0">
                <li v-for="connectionLabel in connectionLabels" :key="connectionLabel">{{ connectionLabel }}</li>
            </ul>
            <p v-else class="text-muted">{{ t(TEXT, 'connections.none.text') }}</p>
        </StudioDocumentSection>
    </PluginPanel>
</template>
