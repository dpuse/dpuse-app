<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { shallowRef, watch } from 'vue';

// App Core
import T from '@/locales/views/workbench/workflow/Workflow.json';
import workflowStepData from '~/knowledge/workbench/benchtops/workflow/workflowSteps.json';
import { localeId, localiseConfigs, t } from '@/locales';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Card from '@/components/card/Card.vue';
import Header from '@/components/header/Header.vue';
import ViewScroller from '@/components/view/ViewScroller.vue';
import ViewShell from '@/components/view/ViewShell.vue';

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const workflowStepConfigs = shallowRef();

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

watch(localeId, (newLocaleId) => (workflowStepConfigs.value = localiseConfigs(workflowStepData, newLocaleId)), { immediate: true });
</script>

<template>
    <ViewShell>
        <Header
            :breadcrumbs="[{ id: 'workbench', label: t(T, 'wb.label') }]"
            class="mr-auto ml-[clamp(0px,calc((100%-56rem)/2),5rem)] w-full max-w-4xl"
            data-testid="header"
            :title="t(T, 'wb.wf.label')"
            :workbench-pane-is-hidden="false"
        />

        <ViewScroller>
            <div class="mr-auto ml-[clamp(0px,calc((100%-56rem)/2),5rem)] max-w-4xl">
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 p-4">
                    <RouterLink
                        v-for="config in workflowStepConfigs"
                        :key="config.id"
                        class="bg-card outline-boundary overflow-hidden rounded-lg font-light outline -outline-offset-1"
                        :to="{ name: config.id, query: { ...route.query, wbView: config.id } }"
                    >
                        <Card :icon="config.icon" :icon-color="config.color" :label="config.label" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                    </RouterLink>
                </div>
            </div>
        </ViewScroller>
    </ViewShell>
</template>
