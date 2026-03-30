<script setup lang="ts">
// External Dependencies
import { PlusIcon } from 'lucide-vue-next';
import { useRoute } from 'vue-router';
import { computed, ref, shallowRef, watch } from 'vue';

// App Core
import T from '@/locales/views/workbench/workflow/establishDataViews/EstablishDataViews.json';
import { localeId, type LocaleLabel, localiseConfigs, t } from '@/locales';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Header from '@/components/header/Header.vue';
import ViewShell from '@/components/view/ViewShell.vue';

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TaskConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleLabel;
    number: number;
    enableUpTo: number;
}
const TASK_CONFIGS: TaskConfig[] = [
    { id: 'selectConnection', number: 1, enableUpTo: 1, label: { en: 'Select Connection' }, description: {} },
    { id: 'selectNode', number: 2, enableUpTo: 2, label: { en: 'Select Node' }, description: {} },
    { id: 'auditContent', number: 3, enableUpTo: 6, label: { en: 'Audit Content' }, description: {} },
    { id: 'auditRelationships', number: 4, enableUpTo: 6, label: { en: 'Audit Relationships' }, description: {} },
    { id: 'transform', number: 5, enableUpTo: 6, label: { en: 'Transform' }, description: {} },
    { id: 'investigate', number: 6, enableUpTo: 6, label: { en: 'Investigate' }, description: {} }
];

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const enableTasksUpTo = ref(TASK_CONFIGS.find((config) => config.id === route.query.wbView)?.enableUpTo ?? 0); // TODO: This also needs to check the actual state of the data view.
const localisedTaskConfigs = shallowRef();

// Derived State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeTaskConfig = computed(() => TASK_CONFIGS.find((config) => config.id === route.query.wbView));

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

watch(localeId, (newLocaleId) => (localisedTaskConfigs.value = localiseConfigs(TASK_CONFIGS, newLocaleId)), { immediate: true });

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleComplete(taskConfig: TaskConfig): void {
    enableTasksUpTo.value = taskConfig.enableUpTo;
}
</script>

<template>
    <ViewShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Establish_Data_Views')" to="establishDataViews" :workbench-pane-is-hidden="false" />

        <div class="border-separator mx-4 flex flex-none items-center justify-between border-b">
            <div v-if="activeTaskConfig" class="flex gap-x-3 overflow-x-auto overscroll-x-none text-[15px]">
                <RouterLink
                    v-for="taskConfig in localisedTaskConfigs"
                    :key="taskConfig.id"
                    :aria-selected="activeTaskConfig.id === taskConfig.id"
                    class="border-y-2 border-t-transparent pb-1 leading-tight"
                    :class="{
                        'border-b-blue-500': activeTaskConfig.id === taskConfig.id,
                        'border-b-zinc-500': activeTaskConfig.id !== taskConfig.id && taskConfig.number <= enableTasksUpTo,
                        'border-b-zinc-200': activeTaskConfig.id !== taskConfig.id && taskConfig.number > enableTasksUpTo
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

            <RouterLink v-else class="ml-auto py-2" :to="{ name: 'selectConnection', query: { ...route.query, wbView: 'selectConnection' } }">
                <PlusIcon stroke-width="1.25" />
            </RouterLink>
        </div>

        <RouterView v-slot="{ Component }">
            <component :is="Component" :task-config="activeTaskConfig" @complete="handleComplete" />
        </RouterView>
    </ViewShell>
</template>
