<script setup lang="ts">
// Local (App) Framework
import T from './WorkflowHomeLayout.json';
import { t } from '@/state/locale';
import { useWorkflowOptionConfigs } from '@/domains/workbench/workflow/useWorkflowOptionConfigs';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Card from '@/components/ui/card/Card.vue';
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';
import ScrollArea from '@/components/layout/scrollArea/ScrollArea.vue';
import Separator from '@/components/ui/separator/Separator.vue';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const workflowOptionConfigs = useWorkflowOptionConfigs();
</script>

<template>
    <LayoutShell class="dpuse-workbench-prose" data-layout="WorkflowHome">
        <!-- Header -->
        <Header :overline="t(T, 'wb.label')" :title="t(T, 'wb.wf.label')" />

        <!-- Workflow Steps -->
        <Separator class="mx-4" />
        <ScrollArea class="flex-1" scroll-area-padding="screen">
            <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                <Button
                    v-for="config in workflowOptionConfigs"
                    :key="config.id"
                    class="mt-4 ml-4"
                    shape="minimal"
                    :to="{ name: config.id, query: { ...$route.query, wbView: config.id } }"
                >
                    <Card :description="config.description" :icon="config.icon" :label="config.label" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                </Button>
            </div>
        </ScrollArea>
    </LayoutShell>
</template>
