<script setup lang="ts">
// External Dependencies
import { computed, ref, shallowRef, watch } from 'vue';
import { type LocationQueryValue, useRoute } from 'vue-router';

// DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local (App) Framework
import { activeDataViewConfig } from '@/state/establishDataViews';
import T from './EstablishDataViewsLayout.json';
import { localeId, t } from '@/state/locale';

// Local Components - Static
import FloatingActionButton from '@/components/layout/floatingActionButton/FloatingActionButton.vue';
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';
import Tasks, { type TaskConfig } from '@/components/ui/tasks/Tasks.vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const STEP_CONFIGS: TaskConfig[] = [
    { id: 'selectConnection', number: 1, label: { en: 'Connection' }, description: {}, disabled: true, enableUpTo: 1, verb: { en: 'Select' } },
    { id: 'selectNode', number: 2, label: { en: 'Node' }, description: {}, disabled: true, enableUpTo: 2, verb: { en: 'Select' } },
    { id: 'auditContent', number: 3, label: { en: 'Content' }, description: {}, disabled: true, enableUpTo: 3, verb: { en: 'Audit' } },
    // { id: 'auditLinks', number: 4, label: { en: 'Links' }, description: {}, disabled: true, enableUpTo: 5, verb: { en: 'Audit' } }, // TODO: Could be named 'Relationships'?
    { id: 'exploreData', number: 4, label: { en: 'Data' }, description: {}, disabled: true, enableUpTo: 5, verb: { en: 'Explore' } } // TODO, Could be split into 'Transform' and 'Investigate'.
];

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

const stepLocalisedConfigs = shallowRef<LocalisedConfig<TaskConfig>[]>([]);

const stepsEnabledToNumber = ref(initialiseEnabledSteps());

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const activeStepLocalisedConfig = computed(() => STEP_CONFIGS.find((config) => config.id === route.query.wbView));

const backRouteName = computed(() => (route.query.wbView === 'establishDataViews' ? 'workflow' : 'establishDataViews'));

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(route, (newRoute) => setEnabledSteps(newRoute.query.wbView));

watch(
    [stepsEnabledToNumber, localeId],
    ([newStepsEnabledToNumber, newLocaleId]) => {
        stepLocalisedConfigs.value = localiseConfigs<TaskConfig>(STEP_CONFIGS, newLocaleId).map((stepLocalisedConfig) => ({
            ...stepLocalisedConfig,
            disabled: stepLocalisedConfig.number > newStepsEnabledToNumber
        }));
    },
    { immediate: true }
);

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function updateStepProgression(stepLocalisedConfig: LocalisedConfig<TaskConfig>): void {
    stepsEnabledToNumber.value = stepLocalisedConfig.enableUpTo;
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function initialiseEnabledSteps(): number {
    // TODO: This also needs to check the actual state of the data view.
    return STEP_CONFIGS.find((config) => config.id === route.query.wbView)?.enableUpTo ?? 0;
}

function setEnabledSteps(wbView: LocationQueryValue | LocationQueryValue[]): void {
    const pendingEnableStepsUpTo = STEP_CONFIGS.find((config) => config.id === wbView)?.enableUpTo ?? 0;
    if (pendingEnableStepsUpTo > stepsEnabledToNumber.value) stepsEnabledToNumber.value = pendingEnableStepsUpTo;
}
</script>

<template>
    <LayoutShell>
        <!-- Header -->
        <Header class="px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Establish_Data_Views')" :to="backRouteName" />

        <!-- Action Bar -->
        <nav class="border-separator mx-4 flex flex-none items-center justify-between border-b">
            <!-- Tasks -->
            <Tasks v-if="activeStepLocalisedConfig" :active-step-id="activeStepLocalisedConfig.id" :items="stepLocalisedConfigs" />
        </nav>

        <!-- Data View List or Active Step Panel -->
        <div class="relative flex flex-1 flex-col overflow-hidden">
            <RouterView v-slot="{ Component }">
                <component :is="Component" class="h-full" :step-localised-config="activeStepLocalisedConfig" @step-completed="updateStepProgression" />
            </RouterView>

            <FloatingActionButton
                v-if="route.query.wbView === 'establishDataViews'"
                class="fixed right-(--safe-right-offset) bottom-(--safe-bottom-offset)"
                :component-type-label="'Data View'"
                :to="{ name: 'selectConnection', params: { dataViewId: '_new_' }, query: { ...route.query, wbView: 'selectConnection' } }"
                variant="add"
                :verb="'Add'"
                @click="activeDataViewConfig = undefined"
            />
        </div>
    </LayoutShell>
</template>
