<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { HomeIcon } from '@lucide/vue';
import { useRoute } from 'vue-router';

// ── DPUse Framework
import { localiseConfigs } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';
import { navigationPendingDepth } from '@/router';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';
import TabBar from '@/components/ui/TabBar.vue';

// ── Data
import data from './_config.json';
import T from './+ConfigLayout.json';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONFIG_OPTION_CONFIGS = data.options as ConfigOptionConfig[];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const configOptionLocalisedConfigs = computed(() => localiseConfigs<ConfigOptionConfig>(CONFIG_OPTION_CONFIGS, localeId.value));
const route = useRoute();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const configOptionActiveLocalisedConfig = computed(() => configOptionLocalisedConfigs.value.find((config) => config.to === route.name) ?? configOptionLocalisedConfigs.value[0]);
const configOptionPanelIsLoading = computed(() => navigationPendingDepth.value === 1);
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-4" :overline="t(T, 'studio.label')" :title="t(T, 'manageConfig.title')" to="studio" />

        <!-- Tab Bar -->
        <TabBar class="flex-none" :active-id="configOptionActiveLocalisedConfig.id" :items="configOptionLocalisedConfigs">
            <template #default="{ item }">
                <HomeIcon v-if="item.id === 'home'" class="size-4.75! [&>path]:stroke-2" />
                <div v-else class="text-sm">{{ item.label }}</div>
            </template>
        </TabBar>

        <!-- Body -->
        <RouterView v-slot="{ Component }">
            <ComponentLoadingSpinner v-if="configOptionPanelIsLoading" />

            <!-- Keyed by route because one 'ConfigModuleList' instance serves the connector, presenter, cookbook and tool
                 tabs; without the remount its selection would carry across from the tab last visited. -->
            <component
                :is="Component"
                v-else
                :key="route.name"
                :config="configOptionActiveLocalisedConfig"
                v-bind="route.name === 'config' ? { configOptionLocalisedConfigs } : {}"
            />
        </RouterView>
    </StudioLayout>
</template>
