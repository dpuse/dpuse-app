<script setup lang="ts">
import { PlusIcon } from 'lucide-vue-next';
import { useRoute } from 'vue-router';

// App Core
import { t } from '@/locales';
import T from '@/locales/views/workbench/workflow/establishDataViews/EstablishDataViews.json';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Header from '@/components/header/Header.vue';
import ViewShell from '@/components/view/ViewShell.vue';

const taskConfigs = [
    { id: 'selectConnection', number: 1, label: 'Select Connection' },
    { id: 'selectNode', number: 2, label: 'Select Node' },
    { id: 'auditContent', number: 3, label: 'Audit Content' },
    { id: 'auditRelationships', number: 4, label: 'Audit Relationships' },
    { id: 'transform', number: 5, label: 'Transform' },
    { id: 'investigate', number: 6, label: 'Investigate' }
];

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();
</script>

<template>
    <ViewShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Establish_Data_Views')" :workbench-pane-is-hidden="false" />

        <div class="border-separator mx-4 flex flex-none items-center justify-between border-b">
            <div class="flex gap-x-3 text-[15px]">
                <RouterLink
                    v-for="taskConfig in taskConfigs"
                    :key="taskConfig.id"
                    class="border-y-2 border-t-transparent border-b-zinc-300 pb-1 leading-tight"
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
