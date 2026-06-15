<script setup lang="ts">
// ── External Dependencies & Registrations
import { ref } from 'vue';

// ── Local (App) Framework
import { t } from '@/state/locale';
import T from './ManageConfigsLayout.json';
import { useConfigOptionConfigs } from './useConfigOptionConfigs.ts';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import HomeIcon from '@/components/icons/HomeIcon.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// ── States ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const configTypes = useConfigOptionConfigs();

const activeConfigType = ref(configTypes.value[0]);
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Manage_Configs')" to="workbench" />

        <div class="flex min-h-0 flex-1 flex-col">
            <!-- Task Bar -->
            <div class="mx-4 flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                <template v-for="configType in configTypes" :key="configType.id">
                    <Button
                        class="border-y-2 border-t-transparent py-1.25"
                        :class="configType.id === activeConfigType.id ? 'border-b-blue-400' : 'border-b-transparent'"
                        shape="minimal"
                        :to="{ name: configType.to, query: { ...$route.query, wbView: configType.to } }"
                        @click="activeConfigType = configType"
                    >
                        <HomeIcon v-if="configType.id === 'home'" class="size-5! [&>path]:stroke-[1.25]" />
                        <div v-else class="text-sm">{{ configType.label }}</div>
                    </Button>
                </template>
            </div>

            <!-- Body -->
            <RouterView />
        </div>
    </WorkbenchLayout>
</template>
