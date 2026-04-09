<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';

// App Core
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import T from '@/locales/domains/workbench/workflow/Workflow.json';
import workflowOptionData from '~/knowledge/workbench/benchtops/workflow/workflowOptions.json';
import { localeId, localiseConfigs, t } from '@/locales';

// App Components - Statically imported so always available, even after app goes offline.
import Card from '@/components/card/Card.vue';
import ContentScroller from '@/components/contentScroller/ContentScroller.vue';
import Header from '@/components/header/Header.vue';
import LayoutShell from '@/components/layoutShell/LayoutShell.vue';

// Derived State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const workflowOptionConfigs = computed(() => localiseConfigs<BenchtopOptionLocalisedConfig>(workflowOptionData, localeId.value));
</script>

<template>
    <LayoutShell>
        <Header
            :breadcrumbs="[{ id: 'workbench', label: t(T, 'wb.label') }]"
            class="dpuse-workbench-prose w-full"
            data-testid="header"
            :title="t(T, 'wb.wf.label')"
            :workbench-pane-is-hidden="false"
        />

        <ContentScroller>
            <div class="dpuse-workbench-prose">
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 p-4">
                    <RouterLink
                        v-for="config in workflowOptionConfigs"
                        :key="config.id"
                        class="outline-boundary overflow-hidden rounded-lg font-light outline -outline-offset-1"
                        :to="{ name: config.id, query: { ...$route.query, wbView: config.id } }"
                    >
                        <Card :icon="config.icon" :icon-color="config.color" :label="config.label" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                    </RouterLink>
                </div>
            </div>
        </ContentScroller>
    </LayoutShell>
</template>
