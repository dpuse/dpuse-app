<script setup lang="ts">
// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';

// ── Static Components
import ConfigModulePanel from '@/features/studio/config/_components/ConfigModulePanel.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig>;
    localisedConfig: LocalisedConfig<PresenterConfig>;
}
const { activeConfigOptionConfig, localisedConfig } = defineProps<Properties>();
</script>

<template>
    <!-- 'clear' and 'close' reach 'ConfigModulePanel' by attribute fallthrough, so this must stay single-root. -->
    <ConfigModulePanel :active-config-option-config="activeConfigOptionConfig" :localised-config="localisedConfig" />
</template>
