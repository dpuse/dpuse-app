<script setup lang="ts">
// ── External Dependencies & Registrations
import { ref } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';
import T from './ManageConfigLayout.json';
import { useConfigOptionConfigs } from './useConfigOptionConfigs.ts';

// ── Local Components - Static
import HomeIcon from '@/components/icons/HomeIcon.vue';
import StudioHeader from '../StudioHeader.vue';
import StudioLayout from '../StudioLayout.vue';
import TabBar from '@/components/ui/TabBar.vue';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

const configOptionConfigs = useConfigOptionConfigs();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConfigOptionConfig = ref(configOptionConfigs.value[0]);
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-4" overline="Studio" :title="t(T, 'Manage_Configs')" to="studio" />

        <!-- Tab Bar -->
        <TabBar class="mx-4 flex-none" :active-id="activeConfigOptionConfig.id" :items="configOptionConfigs" @select="activeConfigOptionConfig = $event">
            <template #default="{ item }">
                <HomeIcon v-if="item.id === 'home'" class="[&>path]:stroke-1.25 size-5!" />
                <div v-else class="text-sm">{{ item.label }}</div>
            </template>
        </TabBar>

        <!-- Body -->
        <RouterView />
    </StudioLayout>
</template>
