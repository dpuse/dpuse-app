<script setup lang="ts">
// Workbench core
import TRANSLATIONS from '@/locales/Workflow.json';
import { useKnowledge } from '@/composables/useKnowledge';
import { localeId, t } from '@/locales';

// Workbench components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Header from '@/components/block/header/Header.vue';

// Properties
defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isWideDisplay: boolean }>();

// Workflow step configurations sourced from knowledge store
const workflowStepConfigs = useKnowledge().getBenchtopConfig('workflow', localeId.value).options;
</script>

<template>
    <BenchtopShell :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-wide-display="isWideDisplay">
        <Header :title="t(TRANSLATIONS, 'workflow')" data-testid="header" :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-wide-display="isWideDisplay" />

        <BenchtopScroller class="flex-1">
            <div class="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4 p-4">
                <RouterLink
                    v-for="config of workflowStepConfigs"
                    :key="config.id"
                    class="bg-background-card outline-border overflow-hidden font-light outline -outline-offset-1 sm:rounded-lg"
                    :to="{ name: config.id }"
                >
                    <div class="flex flex-col gap-y-4 p-4">
                        <div aria-hidden="true" class="size-8" :style="{ color: `${config.color}` }" v-html="config.icon" />
                        <div>
                            <div class="text-foreground-secondary text-xs font-normal uppercase">{{ t(TRANSLATIONS, 'step') }} {{ config.step }}</div>
                            {{ config.label }}
                        </div>
                    </div>
                </RouterLink>
            </div>
        </BenchtopScroller>
    </BenchtopShell>
</template>
