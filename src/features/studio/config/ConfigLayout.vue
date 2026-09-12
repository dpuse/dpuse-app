<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { HomeIcon } from '@lucide/vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';
import { navigationPendingDepth } from '@/router';
import { t } from '@/state/locale';
import T from './_ConfigLayout.json';
import { useConfigOptions } from './useConfigOptions';

// ── Static Components
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';
import TabBar from '@/components/ui/TabBar.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const configOptionLocalisedConfigs = useConfigOptions();
const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const configOptionActiveLocalisedConfig = computed(() => configOptionLocalisedConfigs.value.find((config) => config.to === route.name) ?? configOptionLocalisedConfigs.value[0]);
const configOptionPanelIsLoading = computed(() => navigationPendingDepth.value === 1); // Depth 1 is this layout's own child route (the active tab's panel); true only past the spinner delay, not the whole navigation.

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Re-clicking the already-active tab doesn't navigate (same route, same query), so nothing else would clear the
// child panel's own selection. Stripping 'configId' here is what sends 'PluginList'/'ContextModelList' back to
// their unselected, list-only state.
function handleTabSelect(item: LocalisedConfig<ConfigOptionConfig>): void {
    if (item.id !== configOptionActiveLocalisedConfig.value.id || typeof route.params.configId !== 'string') return;
    void router.replace({ name: route.name ?? undefined, params: { configId: undefined }, query: route.query }).catch(() => {
        // Already reported by 'router.onError'.
    });
}
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader :overline="t(T, 'studio.label')" :title="t(T, 'manageConfig.title')" to="studio" />

        <!-- Tab Bar -->
        <TabBar :active-id="configOptionActiveLocalisedConfig.id" :items="configOptionLocalisedConfigs" @select="handleTabSelect">
            <template #default="{ item }">
                <HomeIcon v-if="item.id === 'home'" class="size-4.75! [&>path]:stroke-2" />
                <div v-else class="text-sm">{{ item.label }}</div>
            </template>
        </TabBar>

        <!-- Body - Active config tab's panel. -->
        <RouterView v-slot="{ Component }">
            <ComponentLoadingSpinner v-if="configOptionPanelIsLoading" />

            <!-- Keyed by route: the module tabs share one 'PluginList' instance, whose selection state won't clear on its own when reused. -->
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
