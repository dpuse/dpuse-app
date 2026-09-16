<script setup lang="ts">
// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';

// ── Local Framework
import type { SetupOptionConfig } from '@/utilities/index.ts';

// ── Static Components
import PluginPanel from '@/features/studio/setup/plugins/_components/PluginPanel.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { pluginLocalisedConfig, setupOptionLocalisedConfig } = defineProps<{
    pluginLocalisedConfig: LocalisedConfig<PresenterConfig>;
    setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig>;
}>();
</script>

<template>
    <!-- 'close' reaches 'PluginPanel' by attribute fallthrough, so this must stay single-root. -->
    <PluginPanel :plugin-localised-config="pluginLocalisedConfig" :setup-option-localised-config="setupOptionLocalisedConfig">
        <!-- TODO -->
    </PluginPanel>
</template>
