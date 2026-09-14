<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { HomeIcon } from '@lucide/vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { navigationPendingDepth } from '@/router';
import type { SetupOptionConfig } from '@/utilities/index.ts';
import { T } from './SetupLayout_.json';
import { t } from '@/state/locale';
import { useSetupOptions } from './useSetupOptions';
import { useSetupRoute } from './useSetupRoute';

// ── Static Components
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';
import TabBar from '@/components/ui/TabBar.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const setupOptionLocalisedConfigs = useSetupOptions();
const { routeId, routeName, setRouteId } = useSetupRoute();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const setupOptionLocalisedConfigActive = computed(() => setupOptionLocalisedConfigs.value.find((config) => config.to === routeName.value) ?? setupOptionLocalisedConfigs.value[0]);
const setupOptionPanelIsLoading = computed(() => navigationPendingDepth.value === 1); // Depth 1 is this layout's own child route (the active tab's panel); true only past the spinner delay, not the whole navigation.

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleTabSelect(setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig>): void {
    if (setupOptionLocalisedConfig.id !== setupOptionLocalisedConfigActive.value.id || routeId.value === undefined) return; // Exit if setup option id has changed or route context/plugin id is undefined.
    setRouteId(undefined); // Active tab clicked again - remove context/plugin id from path to clear active selection.
}
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader :overline="t(T, 'studio.label')" :title="t(T, 'manageSetup.title')" to="studio" />

        <!-- Tab Bar -->
        <TabBar :active-id="setupOptionLocalisedConfigActive.id" :items="setupOptionLocalisedConfigs" @select="handleTabSelect">
            <template #default="{ item }">
                <HomeIcon v-if="item.id === 'home'" class="size-4.75! [&>path]:stroke-2" />
                <div v-else class="text-sm">{{ item.label }}</div>
            </template>
        </TabBar>

        <!-- Body - Active setup tab's panel. -->
        <RouterView v-slot="{ Component }">
            <ComponentLoadingSpinner v-if="setupOptionPanelIsLoading" />

            <!-- Keyed by route: the module tabs share one 'PluginList' instance, whose selection state won't clear on its own when reused. -->
            <component
                :is="Component"
                v-else
                :key="routeName"
                v-bind="routeName === 'setup' ? { setupOptionLocalisedConfigs } : { setupOptionLocalisedConfig: setupOptionLocalisedConfigActive }"
            />
        </RouterView>
    </StudioLayout>
</template>
