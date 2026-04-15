<script setup lang="ts">
// External Dependencies
import { ref } from 'vue';

// DPUse Framework
import type { ConnectionLocalisedConfig } from '@dpuse/dpuse-shared/component/connector';
import type { EngineAuthActionOptions } from '@dpuse/dpuse-shared/engine';

// App Core
import T from '@/translations/domains/session/authDialog/LoginForm.json';
import { t } from '@/translations';
import { useEngine } from '@/services/useEngine';

// App Components - Statically imported.
import Button from '@/components/ui/button/Button.vue';
import Input from '@/components/ui/input/Input.vue';

// Properties & Emits ──────────────────────────────────────────────────────────────────────────────────────────────────

const { connectionLocalisedConfig } = defineProps<{ connectionLocalisedConfig: ConnectionLocalisedConfig | undefined }>();
const emit = defineEmits<{ (event: 'complete'): void }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const connectionLabel = ref<string | undefined>();

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function triggerComplete(): void {
    emit('complete');
}

// EXPERIMENTAL ────────────────────────────────────────────────────────────────────────────────────────────────────────

async function testAuth(): Promise<void> {
    if (connectionLocalisedConfig == null || connectionLocalisedConfig == null) return;
    const { processRequest } = await useEngine();
    (await processRequest('authenticateConnection', connectionLocalisedConfig, {
        accountId: "JMT's Account",
        windowCenterX: screen.width / 2,
        windowCenterY: screen.height / 2
    })) as EngineAuthActionOptions;
}
</script>

<template>
    {{ connectionLocalisedConfig?.connectorConfig.implementations ?? 'PENDING...' }}

    <Input id="label" v-model="connectionLabel" :label="t(T, 'Label')" :placeholder="t(T, 'Label')" :required="true" type="text" />

    <Button @click="testAuth">Auth...</Button>

    <RouterLink :to="{ name: 'selectNode', query: { ...$route.query, wbView: 'selectNode' } }" @click="triggerComplete">Select</RouterLink>
</template>
