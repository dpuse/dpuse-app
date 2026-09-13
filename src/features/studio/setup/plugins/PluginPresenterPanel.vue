<script setup lang="ts">
// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';

// ── Local Framework
import type { SetupOptionConfig } from '@/utilities/index.ts';

// ── Static Components
import PluginPanel from '@/features/studio/setup/plugins/_components/PluginPanel.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    config: LocalisedConfig<SetupOptionConfig>;
    localisedConfig: LocalisedConfig<PresenterConfig>;
}
const { config, localisedConfig } = defineProps<Properties>();
</script>

<template>
    <!-- 'clear' and 'close' reach 'PluginPanel' by attribute fallthrough, so this must stay single-root. -->
    <PluginPanel :config="config" :localised-config="localisedConfig" />
</template>
