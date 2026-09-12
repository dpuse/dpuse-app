<script setup lang="ts">
// ── DPUse Framework
import type { CookbookConfig } from '@dpuse/dpuse-shared/component/module/cookbook';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';

// ── Static Components
import ConfigPluginShell from '@/features/studio/config/plugins/_components/ConfigPluginShell.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    config: LocalisedConfig<ConfigOptionConfig>;
    localisedConfig: LocalisedConfig<CookbookConfig>;
}
const { config, localisedConfig } = defineProps<Properties>();
</script>

<template>
    <!-- 'clear' and 'close' reach 'ConfigPluginShell' by attribute fallthrough, so this must stay single-root. -->
    <ConfigPluginShell :config="config" :localised-config="localisedConfig" />
</template>
