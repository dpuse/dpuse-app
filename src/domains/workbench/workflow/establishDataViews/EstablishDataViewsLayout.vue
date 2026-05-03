<script setup lang="ts">
// External Dependencies
import { PlusIcon } from 'lucide-vue-next';
import { computed, ref, shallowRef, watch } from 'vue';
import { type LocationQueryValue, useRoute } from 'vue-router';

// DPUse Framework
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local (App) Framework
import { activeDataViewConfig } from '@/state/establishDataViews';
import T from './EstablishDataViewsLayout.json';
import { localeId, t } from '@/state/locale';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';
import Steps, { type StepConfig } from '@/components/ui/steps/Steps.vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const STEP_CONFIGS: StepConfig[] = [
    { id: 'selectConnection', number: 1, label: { en: 'Connection' }, description: {}, disabled: true, enableUpTo: 1, verb: { en: 'Select' } },
    { id: 'selectNode', number: 2, label: { en: 'Node' }, description: {}, disabled: true, enableUpTo: 2, verb: { en: 'Select' } },
    { id: 'auditContent', number: 3, label: { en: 'Content' }, description: {}, disabled: true, enableUpTo: 3, verb: { en: 'Audit' } },
    // { id: 'auditLinks', number: 4, label: { en: 'Links' }, description: {}, disabled: true, enableUpTo: 5, verb: { en: 'Audit' } }, // TODO: Could be named 'Relationships'?
    { id: 'exploreData', number: 4, label: { en: 'Data' }, description: {}, disabled: true, enableUpTo: 5, verb: { en: 'Explore' } } // TODO, Could be split into 'Transform' and 'Investigate'.
];

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

const stepLocalisedConfigs = shallowRef<LocalisedConfig<StepConfig>[]>([]);

const stepsEnabledToNumber = ref(initialiseEnabledSteps());

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const activeStepLocalisedConfig = computed(() => STEP_CONFIGS.find((config) => config.id === route.query.wbView));

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

watch(route, (newRoute) => setEnabledSteps(newRoute.query.wbView));

watch(
    [stepsEnabledToNumber, localeId],
    ([newStepsEnabledToNumber, newLocaleId]) => {
        stepLocalisedConfigs.value = localiseConfigs<StepConfig>(STEP_CONFIGS, newLocaleId).map((stepLocalisedConfig) => ({
            ...stepLocalisedConfig,
            disabled: stepLocalisedConfig.number > newStepsEnabledToNumber
        }));
    },
    { immediate: true }
);

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function updateStepProgression(stepLocalisedConfig: LocalisedConfig<StepConfig>): void {
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
        <Header class="px-4" :overline="t(T, 'wb.label')" overline-to="workflow" :title="t(T, 'Establish_Data_Views')" to="establishDataViews" />

        <!-- Action Bar -->
        <nav class="border-separator mx-4 flex flex-none items-center justify-between border-b">
            <!-- Steps -->
            <Steps v-if="activeStepLocalisedConfig" :active-step-id="activeStepLocalisedConfig.id" :items="stepLocalisedConfigs" />

            <!-- Add Action -->
            <RouterLink
                v-else
                class="ml-auto py-2"
                :to="{ name: 'selectConnection', params: { dataViewId: '_new_' }, query: { ...route.query, wbView: 'selectConnection' } }"
                @click="activeDataViewConfig = undefined"
            >
                <Button variant="iconSmall">
                    <PlusIcon stroke-width="1.25" />
                </Button>
            </RouterLink>
        </nav>

        <!-- Data View List or Active Step Panel -->
        <div class="flex flex-1 flex-col overflow-hidden">
            <RouterView v-slot="{ Component }">
                <component :is="Component" :step-localised-config="activeStepLocalisedConfig" @step-completed="updateStepProgression" />
            </RouterView>
        </div>
    </LayoutShell>
</template>
