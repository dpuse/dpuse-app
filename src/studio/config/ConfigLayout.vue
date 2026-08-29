<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// ── DPUse Framework
import { localiseConfigs } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';
import { navigationPendingDepth } from '@/router';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue';
import HomeIcon from '@/components/icons/HomeIcon.vue';
import StudioHeader from '@/studio/_components/StudioHeader.vue';
import StudioLayout from '@/studio/_components/StudioLayout.vue';
import TabBar from '@/components/ui/TabBar.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Manage_Config: { en: 'Manage Configuration', es: 'Gestionar Configuración' },
    Studio: { en: 'Studio', es: 'Estudio' }
};

const CONFIG_OPTION_CONFIGS: ConfigOptionConfig[] = [
    { id: 'home', label: {}, description: {}, icon: null, iconDark: null, to: 'config' },
    {
        id: 'context',
        label: { en: 'Context', es: 'Contexto' },
        description: { en: 'Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.' },
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#ca8a04" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-component-icon lucide-component"><path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/><path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"/><path d="M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"/><path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/></svg>',
        iconDark: null,
        to: 'context'
    },
    {
        id: 'connectors',
        label: { en: 'Connectors', es: 'Conectores' },
        description: { en: 'Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.' },
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cable-icon lucide-cable"><path d="M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z"/><path d="M17 21v-2"/><path d="M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10"/><path d="M21 21v-2"/><path d="M3 5V3"/><path d="M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z"/><path d="M7 5V3"/></svg>',
        iconDark: null,
        to: 'connectors'
    },
    {
        id: 'presenters',
        label: { en: 'Presenters', es: 'Presentadores' },
        description: { en: 'Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.' },
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-presentation-icon lucide-presentation"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/></svg>',
        iconDark: null,
        to: 'presenters'
    },
    {
        id: 'cookbooks',
        label: { en: 'Cookbooks', es: 'Recetarios' },
        description: { en: 'Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.' },
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open-icon lucide-book-open"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
        iconDark: null,
        to: 'cookbooks'
    },
    {
        id: 'tools',
        label: { en: 'Tools', es: 'Herramientas' },
        description: { en: 'Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.' },
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tool-case-icon lucide-tool-case"><path d="M10 15h4"/><path d="m14.817 10.995-.971-1.45 1.034-1.232a2 2 0 0 0-2.025-3.238l-1.82.364L9.91 3.885a2 2 0 0 0-3.625.748L6.141 6.55l-1.725.426a2 2 0 0 0-.19 3.756l.657.27"/><path d="m18.822 10.995 2.26-5.38a1 1 0 0 0-.557-1.318L16.954 2.9a1 1 0 0 0-1.281.533l-.924 2.122"/><path d="M4 12.006A1 1 0 0 1 4.994 11H19a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg>',
        iconDark: null,
        to: 'tools'
    }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const configOptionLocalisedConfigs = computed(() => localiseConfigs<ConfigOptionConfig>(CONFIG_OPTION_CONFIGS, localeId.value));
const route = useRoute();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConfigOptionConfig = computed(() => configOptionLocalisedConfigs.value.find((config) => config.to === route.name) ?? configOptionLocalisedConfigs.value[0]);

// This layout hosts the 'RouterView' one level in, so it shows the spinner for its own panel. 'App.vue' covers the
// layout itself, which is what keeps the header and tab bar in place through a panel swap.
const panelIsLoading = computed(() => navigationPendingDepth.value === 1);
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-4" :overline="t(T, 'Studio')" :title="t(T, 'Manage_Config')" to="studio" />

        <!-- Tab Bar -->
        <TabBar class="flex-none" :active-id="activeConfigOptionConfig.id" :items="configOptionLocalisedConfigs">
            <template #default="{ item }">
                <!-- eslint-disable-next-line tailwindcss/no-unnecessary-arbitrary-value  -- stroke-1.5 is not a valid preset value.  -->
                <HomeIcon v-if="item.id === 'home'" class="size-5! [&>path]:stroke-[1.5]" />
                <div v-else class="text-sm">{{ item.label }}</div>
            </template>
        </TabBar>

        <!-- Body -->
        <RouterView v-slot="{ Component }">
            <ComponentLoadingSpinner v-if="panelIsLoading" />

            <!-- Keyed by route because one 'ConfigModuleList' instance serves the connector, presenter, cookbook and tool
                 tabs; without the remount its selection would carry across from the tab last visited. -->
            <component
                :is="Component"
                v-else
                :key="route.name"
                :active-config-option-config="activeConfigOptionConfig"
                v-bind="route.name === 'config' ? { configOptionLocalisedConfigs } : {}"
            />
        </RouterView>
    </StudioLayout>
</template>
