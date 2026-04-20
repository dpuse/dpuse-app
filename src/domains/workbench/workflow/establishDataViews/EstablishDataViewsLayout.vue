<script setup lang="ts">
// External Dependencies
import { PlusIcon } from 'lucide-vue-next';
import { useRoute } from 'vue-router';
import { computed, ref, shallowRef, watch } from 'vue';

// DPUse Framework
import { type LocaleLabel, localiseConfigs } from '@dpuse/dpuse-shared/locale';

// Local Framework
import { activeDataViewConfig } from '@/state/establishDataViews';
import T from '@/translations/domains/workbench/workflow/establishDataViews/EstablishDataViewsLayout.json';
import { localeId, t } from '@/translations';

// Local Components - Static
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

interface TaskConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleLabel;
    number: number;
    enableUpTo: number;
}
export type TaskLocalisedConfig = Omit<TaskConfig, 'label' | 'description'> & { label: string; description: string };
const TASK_CONFIGS: TaskConfig[] = [
    { id: 'selectConnection', number: 1, enableUpTo: 1, label: { en: 'Select Connection' }, description: {} },
    { id: 'selectNode', number: 2, enableUpTo: 2, label: { en: 'Select Node' }, description: {} },
    { id: 'auditContent', number: 3, enableUpTo: 6, label: { en: 'Audit Content' }, description: {} },
    { id: 'auditRelationships', number: 4, enableUpTo: 6, label: { en: 'Audit Relationships' }, description: {} },
    { id: 'transform', number: 5, enableUpTo: 6, label: { en: 'Transform' }, description: {} },
    { id: 'investigate', number: 6, enableUpTo: 6, label: { en: 'Investigate' }, description: {} }
];

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

const enableTasksUpTo = ref(TASK_CONFIGS.find((config) => config.id === route.query.wbView)?.enableUpTo ?? 0); // TODO: This also needs to check the actual state of the data view.
const taskLocalisedConfigs = shallowRef<TaskLocalisedConfig[]>([]);

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const activeTaskLocalisedConfig = computed(() => TASK_CONFIGS.find((config) => config.id === route.query.wbView));

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(localeId, (newLocaleId) => (taskLocalisedConfigs.value = localiseConfigs<TaskLocalisedConfig>(TASK_CONFIGS, newLocaleId)), { immediate: true });

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function updateTaskProgression(taskLocalisedConfig: TaskLocalisedConfig): void {
    enableTasksUpTo.value = taskLocalisedConfig.enableUpTo;
}
</script>

<template>
    <LayoutShell>
        <!-- Header -->
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label'), to: 'workflow' }]" :title="t(T, 'Establish_Data_Views')" to="establishDataViews" />

        <!-- Task Action Bar -->
        <nav class="border-separator mx-4 flex flex-none items-center justify-between border-b">
            <div v-if="activeTaskLocalisedConfig" class="flex gap-x-3 overflow-x-auto overscroll-x-none text-[15px]">
                <RouterLink
                    v-for="taskLocalisedConfig in taskLocalisedConfigs"
                    :key="taskLocalisedConfig.id"
                    :aria-selected="activeTaskLocalisedConfig.id === taskLocalisedConfig.id"
                    class="border-y-2 border-t-transparent pb-1 leading-tight"
                    :class="{
                        'border-b-blue-500': activeTaskLocalisedConfig.id === taskLocalisedConfig.id,
                        'border-b-zinc-500': activeTaskLocalisedConfig.id !== taskLocalisedConfig.id && taskLocalisedConfig.number <= enableTasksUpTo,
                        'border-b-zinc-200': activeTaskLocalisedConfig.id !== taskLocalisedConfig.id && taskLocalisedConfig.number > enableTasksUpTo
                    }"
                    role="tab"
                    :to="{ name: taskLocalisedConfig.id, query: { ...route.query, wbView: taskLocalisedConfig.id } }"
                >
                    <div>
                        <div class="text-muted text-xs font-medium">{{ t(T, 'Task') }} {{ taskLocalisedConfig.number }}</div>
                        <span class="text-sm">{{ taskLocalisedConfig.label }}</span>
                    </div>
                </RouterLink>
            </div>

            <RouterLink
                v-else
                class="ml-auto py-2"
                :to="{ name: 'selectConnection', params: { dataViewId: '_new_' }, query: { ...route.query, wbView: 'selectConnection' } }"
                @click="activeDataViewConfig = undefined"
            >
                <PlusIcon stroke-width="1.25" />
            </RouterLink>
        </nav>

        <!-- Data View List or Active Task Panel -->
        <div class="flex flex-1 flex-col overflow-hidden">
            <RouterView v-slot="{ Component }">
                <component :is="Component" :task-localised-config="activeTaskLocalisedConfig" @task-completed="updateTaskProgression" />
            </RouterView>
        </div>
    </LayoutShell>
</template>
