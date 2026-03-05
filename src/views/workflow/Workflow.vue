<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';

// App Core
import T from '@/locales/views/workflow/Workflow.json';
import { useKnowledge } from '@/composables/useKnowledge';
import { localeId, t } from '@/locales';

// App Components
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Card from '@/components/card/Card.vue';
import Header from '@/components/header/Header.vue';

// Properties
const { displayIsWide } = defineProps<{ displayIsWide: boolean }>();

// Workflow step configurations sourced from knowledge store
const workflowStepConfigs = useKnowledge().getBenchtopConfig('workflow', localeId.value).options; // TODO: Does this update if locale changes

// Local route state
const route = useRoute();
</script>

<template>
    <BenchtopShell>
        <Header
            :breadcrumbs="[{ id: 'workbench', label: t(T, 'Workbench') }]"
            class="mr-auto ml-[clamp(0px,calc((100%-56rem)/2),5rem)] w-full max-w-4xl"
            :title="t(T, 'Workflow_Benchtop')"
            data-testid="header"
            :display-is-wide="displayIsWide"
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
                        <Card :icon="config.icon" :icon-color="config.color" :label="config.label" :overline="t(T, 'Step', { number: config.step })" />
                    </RouterLink>
                </div>
            </div>
        </BenchtopScroller>
    </BenchtopShell>
</template>
