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
import { type BreadcrumbConfig, useBreadcrumbs } from '@/composables/useBreadcrumbs';
import { localeId, t } from '@/state/locale';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';
import Steps, { type StepConfig } from '@/components/ui/steps/Steps.vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

// const STEP_CONFIGS: StepConfig[] = [ // TODO: Prior configuration, retained for reference purposes.
//     { id: 'selectConnection', number: 1, enableUpTo: 1, label: { en: 'Select Connection' }, description: {} },
//     { id: 'selectNode', number: 2, enableUpTo: 2, label: { en: 'Select Node' }, description: {} },
//     { id: 'auditContent', number: 3, enableUpTo: 6, label: { en: 'Audit Content' }, description: {} },
//     { id: 'auditRelationships', number: 4, enableUpTo: 6, label: { en: 'Audit Relationships' }, description: {} }, // TODO: 'Relationships' could be renamed to 'Links'.
//     { id: 'transform', number: 5, enableUpTo: 6, label: { en: 'Transform' }, description: {} },
//     { id: 'investigate', number: 6, enableUpTo: 6, label: { en: 'Investigate' }, description: {} }
// ];
const STEP_CONFIGS: StepConfig[] = [
    { id: 'selectConnection', number: 1, label: { en: 'Connection' }, description: {}, disabled: true, enableUpTo: 1, verb: { en: 'Select' } },
    { id: 'selectNode', number: 2, label: { en: 'Node' }, description: {}, disabled: true, enableUpTo: 2, verb: { en: 'Select' } },
    { id: 'auditContent', number: 3, label: { en: 'Content' }, description: {}, disabled: true, enableUpTo: 3, verb: { en: 'Audit' } },
    { id: 'auditLinks', number: 4, label: { en: 'Links' }, description: {}, disabled: true, enableUpTo: 5, verb: { en: 'Audit' } },
    { id: 'exploreData', number: 5, label: { en: 'Data' }, description: {}, disabled: true, enableUpTo: 5, verb: { en: 'Explore' } }
];

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { breadcrumbs } = useBreadcrumbs<BreadcrumbConfig>([{ id: 'benchtop', label: t(T, 'wb.label'), to: 'workflow' }]);

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
    <LayoutShell class="pl-4">
        <!-- Header -->
        <Header class="pr-4" :breadcrumbs="breadcrumbs" :title="t(T, 'Establish_Data_Views')" to="establishDataViews" />

        <!-- Step Action Bar -->
        <nav class="border-separator mr-4 flex flex-none items-center justify-between border-b">
            <Steps v-if="activeStepLocalisedConfig" :active-step-id="activeStepLocalisedConfig.id" :items="stepLocalisedConfigs">
                <template #default="{ item }">
                    <div class="text-muted text-xs font-medium">{{ t(T, 'Step') }}&nbsp;{{ item.number }}</div>
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
