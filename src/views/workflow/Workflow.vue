<script setup lang="ts">
// Application core
import { useKnowledge } from '@/composables/useKnowledge';

// Components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Header from '@/components/block/header/Header.vue';

// Properties
const properties = defineProps<{ isDisplayWide: boolean }>();

// Global state
const activeLangId = 'en'; // TODO: Remove hardcoding...

// Workflow step configurations sourced from knowledge store
// const workflowStepConfigs = useKnowledge()
//     .getBenchtopConfig('workflow', activeLangId)
//     .primaryOptions.filter((config) => config.step);
</script>

<template>
    <BenchtopShell>
        <Header title="Workflow" :is-display-wide="properties.isDisplayWide" />

        <BenchtopScroller>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4 p-4">
                <div
                    class="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10"
                >
                    <div class="px-4 py-5 sm:px-6">Some option</div>
                    <div class="px-4 py-5 sm:p-6"></div>
                    <div class="px-4 py-4 sm:px-6"></div>
                </div>
            </div>
        </BenchtopScroller>
    </BenchtopShell>
</template>
