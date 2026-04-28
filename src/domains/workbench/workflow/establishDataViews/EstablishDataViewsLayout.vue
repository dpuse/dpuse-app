<script setup lang="ts">
// External Dependencies
import { PlusIcon } from 'lucide-vue-next';
import { useRoute, type LocationQueryValue } from 'vue-router';
import { computed, ref, watch } from 'vue';

// DPUse Framework
import { type LocaleLabel, localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local Framework
import T from './EstablishDataViewsLayout.json';

import { activeDataViewConfig } from '@/state/establishDataViews';
import { type BreadcrumbConfig, useBreadcrumbs } from '@/composables/useBreadcrumbs';
import { localeId, t } from '@/state/locale';
import { type StepConfig, useSteps } from '@/composables/useSteps';

// Local Components - Static
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';
import Steps from '@/components/ui/steps/Steps.vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface TaskConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleLabel;
    enableUpTo: number;
    number: number;
    verb?: LocaleLabel;
}

interface TaskStepConfig extends LocalisedConfig<TaskConfig>, StepConfig {}

// const TASK_CONFIGS: TaskConfig[] = [ // TODO: Prior configuration, retained for reference purposes.
//     { id: 'selectConnection', number: 1, enableUpTo: 1, label: { en: 'Select Connection' }, description: {} },
//     { id: 'selectNode', number: 2, enableUpTo: 2, label: { en: 'Select Node' }, description: {} },
//     { id: 'auditContent', number: 3, enableUpTo: 6, label: { en: 'Audit Content' }, description: {} },
//     { id: 'auditRelationships', number: 4, enableUpTo: 6, label: { en: 'Audit Relationships' }, description: {} }, // TODO: 'Relationships' could be renamed to 'Links'.
//     { id: 'transform', number: 5, enableUpTo: 6, label: { en: 'Transform' }, description: {} },
//     { id: 'investigate', number: 6, enableUpTo: 6, label: { en: 'Investigate' }, description: {} }
// ];
const TASK_CONFIGS: TaskConfig[] = [
    { id: 'selectConnection', number: 1, label: { en: 'Connection' }, description: {}, enableUpTo: 1, verb: { en: 'Select' } },
    { id: 'selectNode', number: 2, label: { en: 'Node' }, description: {}, enableUpTo: 2, verb: { en: 'Select' } },
    { id: 'auditContent', number: 3, label: { en: 'Content' }, description: {}, enableUpTo: 5, verb: { en: 'Audit' } },
    { id: 'auditLinks', number: 4, label: { en: 'Links' }, description: {}, enableUpTo: 5, verb: { en: 'Audit' } },
    { id: 'exploreData', number: 5, label: { en: 'Data' }, description: {}, enableUpTo: 5, verb: { en: 'Explore' } }
];

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { breadcrumbs } = useBreadcrumbs<BreadcrumbConfig>([{ id: 'benchtop', label: t(T, 'wb.label'), to: 'workflow' }]);

const enableTasksUpTo = ref(0); // TODO: This also needs to check the actual state of the data view.

const route = useRoute();

const { steps } = useSteps<TaskStepConfig>();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const activeTaskLocalisedConfig = computed(() => TASK_CONFIGS.find((config) => config.id === route.query.wbView));

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(route, (newRoute) => setEnabledTasks(newRoute.query.wbView), { immediate: true });

watch(
    [enableTasksUpTo, localeId],
    ([newEnableTasksUpTo, newLocaleId]) => {
        steps.value = localiseConfigs<TaskConfig>(TASK_CONFIGS, newLocaleId).map((taskLocalisedConfig) => ({
            ...taskLocalisedConfig,
            disabled: taskLocalisedConfig.number > newEnableTasksUpTo,
            to: taskLocalisedConfig.id
        }));
        console.log(steps.value);
    },
    { immediate: true }
);

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function updateTaskProgression(taskLocalisedConfig: LocalisedConfig<TaskConfig>): void {
    enableTasksUpTo.value = taskLocalisedConfig.enableUpTo;
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function setEnabledTasks(wbView: LocationQueryValue | LocationQueryValue[]): void {
    const pendingEnableTasksUpTo = TASK_CONFIGS.find((config) => config.id === wbView)?.enableUpTo ?? 0;
    if (pendingEnableTasksUpTo > enableTasksUpTo.value) enableTasksUpTo.value = pendingEnableTasksUpTo;
}
</script>

<template>
    <LayoutShell>
        <!-- Header -->
        <Header :breadcrumbs="breadcrumbs" :title="t(T, 'Establish_Data_Views')" to="establishDataViews" />

        <!-- Task Action Bar -->
        <nav class="border-separator mx-4 flex flex-none items-center justify-between border-b">
            <Steps v-if="activeTaskLocalisedConfig" :active-step-id="activeTaskLocalisedConfig.id" :items="steps">
                <template #default="{ item }">
                    <div class="text-muted text-xs font-medium">{{ t(T, 'Task') }}&nbsp;{{ item.number }}</div>
                    <span class="block text-sm sm:hidden"> {{ item.label }}</span>
                    <span class="hidden text-sm sm:block">{{ item.verb }} {{ item.label }}</span>
                </template>
            </Steps>

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
