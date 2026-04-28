<script setup lang="ts">
// Local Framework
import T from './WorkflowHomeLayout.json';
import { t } from '@/state/locale';
import { useWorkflowOptionConfigs } from '~/src/domains/workbench/workflow/useWorkflowOptionConfigs';

// Local Framework
import { type BreadcrumbConfig, useBreadcrumbs } from '@/composables/useBreadcrumbs';

// Local Components - Static
import Card from '@/components/ui/card/Card.vue';
import ContentScroller from '@/components/layout/contentScroller/ContentScroller.vue';
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { breadcrumbs } = useBreadcrumbs<BreadcrumbConfig>([{ id: 'workbench', label: t(T, 'wb.label') }]);

const workflowOptionConfigs = useWorkflowOptionConfigs();
</script>

<template>
    <LayoutShell class="dpuse-workbench-prose">
        <!-- Header -->
        <Header :breadcrumbs="breadcrumbs" class="w-full" data-testid="header" :title="t(T, 'wb.wf.label')" />

        <!-- Workflow Steps -->
        <ContentScroller class="pt-4 pb-16">
            <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
                <RouterLink v-for="config in workflowOptionConfigs" :key="config.id" :to="{ name: config.id, query: { ...$route.query, wbView: config.id } }">
                    <Card :icon="config.icon" :icon-color="config.color" :label="config.label" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                </RouterLink>
            </div>
        </ContentScroller>
    </LayoutShell>
</template>
