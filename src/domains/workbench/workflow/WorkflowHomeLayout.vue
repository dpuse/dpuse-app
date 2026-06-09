<script setup lang="ts">
// ── Local (App) Framework
import T from './WorkflowHomeLayout.json';
import { t } from '@/state/locale';
import { useWorkbenchOptionConfigs } from '@/domains/workbench/useWorkbenchOptionConfigs.ts';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Card from '@/components/ui/Card.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const workflowOptionConfigs = useWorkbenchOptionConfigs();
</script>

<template>
    <WorkbenchLayout class="dpuse-workbench-prose" data-layout="WorkflowHome">
        <!-- Header -->
        <WorkbenchHeader :overline="t(T, 'wb.label')" :title="t(T, 'wb.wf.label')" />

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
    </WorkbenchLayout>
</template>
