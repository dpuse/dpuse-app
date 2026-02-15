<script setup lang="ts">
// Workbench core
import T from '@/locales/views/workflow/Workflow.json';
import { useKnowledge } from '@/composables/useKnowledge';
import { localeId, t } from '@/locales';

// Workbench components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Card from '@/components/base/Card.vue';
import Header from '@/components/block/header/Header.vue';

// Properties
type Properties = { isWideDisplay: boolean };
defineProps<Properties>();

// Global state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Workflow step configurations sourced from knowledge store
const workflowStepConfigs = useKnowledge().getBenchtopConfig('workflow', localeId.value).options;
</script>

<template>
    <BenchtopShell>
        <Header
            :breadcrumbs="[{ id: 'workbench', label: t(T, 'overline') }]"
            class="mr-auto ml-[clamp(0px,calc((100%-56rem)/2),5rem)] w-full max-w-4xl"
            :title="t(T, 'title')"
            data-testid="header"
            :is-wide-display="isWideDisplay"
        />

        <BenchtopScroller class="flex-1">
            <div class="mr-auto ml-[clamp(0px,calc((100%-56rem)/2),5rem)] max-w-4xl">
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 p-4">
                    <RouterLink
                        v-for="config of workflowStepConfigs"
                        :key="config.id"
                        class="bg-background-card outline-border overflow-hidden rounded-lg font-light outline -outline-offset-1"
                        :to="{ name: config.id }"
                    >
                        <Card :icon="config.icon" :icon-color="config.color" :label="config.label" :overline="t(T, 'step', { number: config.step })" />
                    </RouterLink>
                </div>
            </div>
        </BenchtopScroller>
    </BenchtopShell>
</template>
