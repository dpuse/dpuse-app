<script setup lang="ts">
// External Dependencies
import { PlusIcon } from 'lucide-vue-next';
import { useRoute } from 'vue-router';
import { computed, onUnmounted } from 'vue';

// App Core
import { t } from '@/locales';
import T from '@/locales/views/workbench/workflow/establishDataViews/EstablishDataViews.json';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Header from '@/components/header/Header.vue';
import ViewShell from '@/components/view/ViewShell.vue';

// Composables
import { useEstablishDataViewsProgress } from './useEstablishDataViewsProgress';

const taskConfigs = [
    { id: 'selectConnection', number: 1, enableTo: 1, label: 'Select Connection' },
    { id: 'selectNode', number: 2, enableTo: 2, label: 'Select Node' },
    { id: 'auditContent', number: 3, enableTo: 3, label: 'Audit Content' },
    { id: 'auditRelationships', number: 4, enableTo: 6, label: 'Audit Relationships' },
    { id: 'transform', number: 5, enableTo: 6, label: 'Transform' },
    { id: 'investigate', number: 6, enableTo: 6, label: 'Investigate' }
];

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeTaskConfig = computed(() => taskConfigs.find((config) => config.id === route.query.wbView) ?? taskConfigs[0]);
const { unlockedUpTo, reset } = useEstablishDataViewsProgress();

onUnmounted(reset);
</script>

<template>
    <ViewShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Establish_Data_Views')" :workbench-pane-is-hidden="false" />

        <div class="border-separator mx-4 flex flex-none items-center justify-between border-b">
            <div class="flex gap-x-3 text-[15px]">
                <RouterLink
                    v-for="taskConfig in taskConfigs"
                    :key="taskConfig.id"
                    :aria-selected="activeTaskConfig.id === taskConfig.id"
                    class="border-y-2 border-t-transparent pb-1 leading-tight"
                    :class="{
                        'border-b-blue-500': activeTaskConfig.id === taskConfig.id,
                        'border-b-zinc-500': activeTaskConfig.id !== taskConfig.id && taskConfig.number <= unlockedUpTo,
                        'border-b-zinc-200': activeTaskConfig.id !== taskConfig.id && taskConfig.number > unlockedUpTo
                    }"
                    role="tab"
                    :to="{ name: taskConfig.id, query: { ...route.query, wbView: taskConfig.id } }"
                >
                    <div>
                        <div class="text-muted text-xs font-medium">Task {{ taskConfig.number }}</div>
                        <span class="text-sm">{{ taskConfig.label }}</span>
                    </div>
                </RouterLink>
            </div>

            <RouterLink :to="{ name: 'selectConnection', query: { ...route.query, wbView: 'selectConnection' } }">
                <PlusIcon stroke-width="1.25" />
            </RouterLink>
        </div>

        <RouterView />
    </ViewShell>
</template>
