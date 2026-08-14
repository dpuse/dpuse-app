<script setup lang="ts">
// ── External Dependencies & Registrations
import { ref } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';
import T from './ManageConfigLayout.json';
import { useConfigOptionConfigs } from './useConfigOptionConfigs.ts';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import HomeIcon from '@/components/icons/HomeIcon.vue';
import StudioHeader from '../StudioHeader.vue';
import StudioLayout from '../StudioLayout.vue';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

const configOptionConfigs = useConfigOptionConfigs();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConfigOptionConfig = ref(configOptionConfigs.value[0]);
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-4" overline="Studio" :title="t(T, 'Manage_Configs')" to="studio" />

        <!-- Task Bar -->
        <div class="mx-4 flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
            <template v-for="configOptionConfig in configOptionConfigs" :key="configOptionConfig.id">
                <Button
                    class="border-y-2 border-t-transparent py-1.25"
                    :class="configOptionConfig.id === activeConfigOptionConfig.id ? 'border-b-blue-400' : 'border-b-transparent'"
                    shape="minimal"
                    :to="{ name: configOptionConfig.to, query: { ...$route.query, sView: configOptionConfig.to } }"
                    @click="activeConfigOptionConfig = configOptionConfig"
                >
                    <HomeIcon v-if="configOptionConfig.id === 'home'" class="[&>path]:stroke-1.25 size-5!" />
                    <div v-else class="text-sm">{{ configOptionConfig.label }}</div>
                </Button>
            </template>
        </div>

        <!-- Body -->
        <RouterView />
    </StudioLayout>
</template>
