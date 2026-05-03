<script setup lang="ts">
// Local (App) Framework
import T from './WorkflowHomeLayout.json';
import { t } from '@/state/locale';
import { useWorkflowOptionConfigs } from '@/domains/workbench/workflow/useWorkflowOptionConfigs';
import { type BreadcrumbConfig, useBreadcrumbs } from '@/composables/useBreadcrumbs';

// Local Components - Static
import Card from '@/components/ui/card/Card.vue';
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';
import ScrollArea from '@/components/ui/scrollArea/ScrollArea.vue';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { breadcrumbs } = useBreadcrumbs<BreadcrumbConfig>([{ id: 'workbench', label: t(T, 'wb.label') }]);

const workflowOptionConfigs = useWorkflowOptionConfigs();
</script>

<template>
    <LayoutShell class="dpuse-workbench-prose px-4">
        <!-- Header -->
        <Header :breadcrumbs="breadcrumbs" data-testid="header" :title="t(T, 'wb.wf.label')" />

        <!-- Workflow Steps -->
        <ScrollArea class="flex-1">
            <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
                <RouterLink v-for="config in workflowOptionConfigs" :key="config.id" :to="{ name: config.id, query: { ...$route.query, wbView: config.id } }">
                    <Card :icon="config.icon" :icon-color="config.color" :label="config.label" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                </RouterLink>
            </div>
        </ScrollArea>
    </LayoutShell>
</template>
