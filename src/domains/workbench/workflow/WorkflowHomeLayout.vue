<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';

// App Core
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import T from '@/translations/domains/workbench/workflow/WorkflowHomeLayout.json';
import workflowOptionData from '~/knowledge/workbench/benchtops/workflow/workflowOptions.json'; // TODO: We do this in at least two other places, maybe we could centralise in state management?
import { localeId, localiseConfigs, t } from '@/translations';

// App Components - Statically imported.
import Card from '@/components/card/Card.vue';
import ContentScroller from '@/components/contentScroller/ContentScroller.vue';
import Header from '@/components/header/Header.vue';
import LayoutShell from '@/components/layoutShell/LayoutShell.vue';

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const workflowOptionConfigs = computed(() => localiseConfigs<BenchtopOptionLocalisedConfig>(workflowOptionData, localeId.value));
</script>

<template>
    <LayoutShell>
        <!-- Header -->
        <Header :breadcrumbs="[{ id: 'workbench', label: t(T, 'wb.label') }]" class="dpuse-workbench-prose w-full" data-testid="header" :title="t(T, 'wb.wf.label')" />

        <!-- Workflow Steps -->
        <ContentScroller>
            <div class="dpuse-workbench-prose grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 p-4">
                <RouterLink
                    v-for="config in workflowOptionConfigs"
                    :key="config.id"
                    class="outline-boundary overflow-hidden rounded-lg font-light outline -outline-offset-1"
                    :to="{ name: config.id, query: { ...$route.query, wbView: config.id } }"
                >
                    <Card :icon="config.icon" :icon-color="config.color" :label="config.label" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                </RouterLink>
            </div>
        </ContentScroller>
    </LayoutShell>
</template>
