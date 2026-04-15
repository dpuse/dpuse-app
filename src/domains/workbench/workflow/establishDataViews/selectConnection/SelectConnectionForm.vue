<script setup lang="ts">
// External Dependencies
import { ref } from 'vue';

// DPUse Framework
import type { ConnectionLocalisedConfig } from '@dpuse/dpuse-shared/component/connector';
import type { EngineAuthActionOptions } from '@dpuse/dpuse-shared/engine';

// App Framework
import T from '@/translations/domains/session/authDialog/LoginForm.json';
import { t } from '@/translations';
import { useEngine } from '@/services/useEngine';

// App Static Components
import Button from '@/components/ui/button/Button.vue';
import Input from '@/components/ui/input/Input.vue';

// Properties, Emits & Slots ───────────────────────────────────────────────────────────────────────────────────────────

const { connectionLocalisedConfig } = defineProps<{ connectionLocalisedConfig?: ConnectionLocalisedConfig }>();

const emit = defineEmits<{ complete: [] }>();

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
