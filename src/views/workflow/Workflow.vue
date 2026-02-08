<script setup lang="ts">
// Workbench core
import { useKnowledge } from '@/composables/useKnowledge';

// Workbench components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Header from '@/components/block/header/Header.vue';

// Properties
const properties = defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isDisplayWide: boolean }>();

// Global state
const activeLangId = 'en'; // TODO: Remove hardcoding...

// Workflow step configurations sourced from knowledge store
const workflowStepConfigs = useKnowledge().getBenchtopConfig('workflow', activeLangId).options;
</script>

<template>
    <BenchtopShell :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-display-wide="properties.isDisplayWide">
        <Header title="Workflow" data-testid="header" :is-display-wide="properties.isDisplayWide" />

        <BenchtopScroller>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4 p-4">
                <div v-for="config of workflowStepConfigs" :key="config.id" class="bg-background-secondary overflow-hidden rounded-lg border">
                    <div class="px-4 py-5 sm:px-6">
                        {{ config.label }}
                    </div>
                    <div class="px-4 py-5 sm:p-6"></div>
                    <div class="px-4 py-4 sm:px-6"></div>
                </div>
            </div>
        </BenchtopScroller>
    </BenchtopShell>
</template>
