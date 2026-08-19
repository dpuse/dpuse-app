<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// ── Local Framework
import { t } from '@/state/locale';
import { useConfigOptionLocalisedConfigs } from './useConfigOptionLocalisedConfigs.ts';

// ── Local Components - Static
import HomeIcon from '@/components/icons/HomeIcon.vue';
import StudioHeader from '../StudioHeader.vue';
import StudioLayout from '../StudioLayout.vue';
import TabBar from '@/components/ui/TabBar.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Manage_Config: { en: 'Manage Configuration', es: '...' }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const configOptionLocalisedConfigs = useConfigOptionLocalisedConfigs();
const route = useRoute();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConfigOptionConfig = computed(() => configOptionLocalisedConfigs.value.find((config) => config.to === route.name) ?? configOptionLocalisedConfigs.value[0]);
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-4" overline="Studio" :title="t(T, 'Manage_Config')" to="studio" />

        <!-- Tab Bar -->
        <TabBar class="mx-4 flex-none" :active-id="activeConfigOptionConfig.id" :items="configOptionLocalisedConfigs">
            <template #default="{ item }">
                <!-- eslint-disable-next-line tailwindcss/no-unnecessary-arbitrary-value  -- stroke-1.5 is not a valid preset value.  -->
                <HomeIcon v-if="item.id === 'home'" class="size-5! [&>path]:stroke-[1.5]" />
                <div v-else class="text-sm">{{ item.label }}</div>
            </template>
        </TabBar>

        <!-- Body -->
        <RouterView />
    </StudioLayout>
</template>
