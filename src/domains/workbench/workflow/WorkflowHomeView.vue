<script setup lang="ts">
// External Dependencies
import { shallowRef, watch } from 'vue';

// App Core
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import T from '@/locales/domains/workbench/workflow/Workflow.json';
import workflowStepData from '~/knowledge/workbench/benchtops/workflow/workflowSteps.json';
import { localeId, localiseConfigs, t } from '@/locales';

// App Components - Statically imported so always available, even after app goes offline.
import Card from '@/components/card/Card.vue';
import Header from '@/components/header/Header.vue';
import PanelScroller from '@/components/panelScroller/PanelScroller.vue';
import ViewShell from '@/components/viewShell/ViewShell.vue';

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const workflowStepConfigs = shallowRef<BenchtopOptionLocalisedConfig[]>([]);

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

watch(localeId, (newLocaleId) => (workflowStepConfigs.value = localiseConfigs<BenchtopOptionLocalisedConfig>(workflowStepData, newLocaleId)), { immediate: true });
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

        <PanelScroller>
            <div class="mr-auto ml-[clamp(0px,calc((100%-56rem)/2),5rem)] max-w-4xl">
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 p-4">
                    <RouterLink
                        v-for="config in workflowStepConfigs"
                        :key="config.id"
                        class="bg-card outline-boundary overflow-hidden rounded-lg font-light outline -outline-offset-1"
                        :to="{ name: config.id, query: { ...$route.query, wbView: config.id } }"
                    >
                        <Card :icon="config.icon" :icon-color="config.color" :label="config.label" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                    </RouterLink>
                </div>
            </div>
        </PanelScroller>
    </ViewShell>
</template>
