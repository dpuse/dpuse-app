<script setup lang="ts">
// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';

// ── Static Components
import ConfigModulePanel from '@/features/studio/config/modules/_components/ConfigModulePanel.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    config: LocalisedConfig<ConfigOptionConfig>;
    localisedConfig: LocalisedConfig<ToolConfig>;
}
const { config, localisedConfig } = defineProps<Properties>();
</script>

<template>
    <!-- 'close' reaches 'ConfigModulePanel' by attribute fallthrough, so this must stay single-root. -->
    <ConfigModulePanel :config="config" :localised-config="localisedConfig" />
</template>
