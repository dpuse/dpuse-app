<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { shallowRef, watch } from 'vue';

// App Core
import T from '@/locales/views/workflow/Workflow.json';
import workflowStepData from '~/knowledge/workbench/benchtops/workflow/workflowSteps.json';
import { localeId, localiseConfigs, t } from '@/locales';

// App Components
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Card from '@/components/card/Card.vue';
import Header from '@/components/header/Header.vue';

// Properties & Emits
const { displayIsWide } = defineProps<{ displayIsWide: boolean }>();

// States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

const workflowStepConfigs = shallowRef();
watch(localeId, (newLocaleId) => (workflowStepConfigs.value = localiseConfigs(workflowStepData, newLocaleId)), { immediate: true });
</script>

<template>
    <BenchtopShell>
        <Header
            :breadcrumbs="[{ id: 'workbench', label: t(T, 'wb.label') }]"
            class="mr-auto ml-[clamp(0px,calc((100%-56rem)/2),5rem)] w-full max-w-4xl"
            data-testid="header"
            :display-is-wide="displayIsWide"
            :title="t(T, 'wb.wf.label')"
            :workbench-pane-is-hidden="false"
        />

        <BenchtopScroller class="flex-1 pb-3">
            <div class="mr-auto ml-[clamp(0px,calc((100%-56rem)/2),5rem)] max-w-4xl">
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 p-4">
                    <RouterLink
                        v-for="config of workflowStepConfigs"
                        :key="config.id"
                        class="bg-card outline-boundary overflow-hidden rounded-lg font-light outline -outline-offset-1"
                        :to="{ name: config.id, query: route.query }"
                    >
                        <Card :icon="config.icon" :icon-color="config.color" :label="config.label" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                    </RouterLink>
                </div>
            </div>
        </BenchtopScroller>
    </BenchtopShell>
</template>
