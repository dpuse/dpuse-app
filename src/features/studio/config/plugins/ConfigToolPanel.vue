<script setup lang="ts">
// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';

// ── Static Components
import ConfigPluginShell from '@/features/studio/config/plugins/_components/ConfigPluginShell.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    config: LocalisedConfig<ConfigOptionConfig>;
    localisedConfig: LocalisedConfig<ToolConfig>;
}
const { config, localisedConfig } = defineProps<Properties>();
</script>

<template>
    <!-- 'close' reaches 'ConfigPluginShell' by attribute fallthrough, so this must stay single-root. -->
    <ConfigPluginShell :config="config" :localised-config="localisedConfig" />
</template>
