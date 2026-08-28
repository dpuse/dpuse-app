<script setup lang="ts">
// ── DPUse Framework
import type { CookbookConfig } from '@dpuse/dpuse-shared/component/module/cookbook';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';

// ── Static Components
import ConfigModulePanel from '@/studio/config/components/ConfigModulePanel.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig>;
    localisedConfig: LocalisedConfig<CookbookConfig>;
}
const { activeConfigOptionConfig, localisedConfig } = defineProps<Properties>();
</script>

<template>
    <!-- 'clear' and 'close' reach 'ConfigModulePanel' by attribute fallthrough, so this must stay single-root. -->
    <ConfigModulePanel :active-config-option-config="activeConfigOptionConfig" :localised-config="localisedConfig" />
</template>
