<script setup lang="ts">
// ── Local Framework
import T from './HomeLayout.json';
import { t } from '@/state/locale';
import { useWorkbenchOptions } from '@/domains/workbench/useWorkbenchOptions.ts';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Card from '@/components/ui/Card.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

const workflowOptionConfigs = useWorkbenchOptions();
</script>

<template>
    <WorkbenchLayout data-layout="WorkbenchHome">
        <!-- Header -->
        <WorkbenchHeader :overline="t(T, 'wb.label')" :title="t(T, 'wb.wf.label')" />

        <Separator class="mx-4" />

        <!-- Workflow Steps -->
        <ScrollArea class="flex-1" scroll-area-padding="screen">
            <div class="max-w-4xl">
                <h2 class="mt-4 ml-4">Workflow</h2>

                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                    <Button
                        v-for="config in workflowOptionConfigs.slice(0, 3)"
                        :key="config.id"
                        class="mt-4 ml-4"
                        shape="minimal"
                        :to="{ name: config.id, query: { ...$route.query, wbView: config.id } }"
                    >
                        <Card :description="config.description" :icon="config.icon" :label="config.label" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                    </Button>
                </div>

                <h2 class="mt-4 ml-4">Build Data Apps</h2>
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                    <Button
                        v-for="config in workflowOptionConfigs.slice(3, 4)"
                        :key="config.id"
                        class="mt-4 ml-4"
                        shape="minimal"
                        :to="{ name: config.id, query: { ...$route.query, wbView: config.id } }"
                    >
                        <Card :description="config.description" :icon="config.icon" :label="config.label" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                    </Button>
                </div>

                <h2 class="mt-4 ml-4">Configuration</h2>
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                    <Button
                        v-for="config in workflowOptionConfigs.slice(4)"
                        :key="config.id"
                        class="mt-4 ml-4"
                        shape="minimal"
                        :to="{ name: config.id, query: { ...$route.query, wbView: config.id } }"
                    >
                        <Card :description="config.description" :icon="config.icon" :label="config.label" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                    </Button>
                </div>
            </div>
        </ScrollArea>
    </WorkbenchLayout>
</template>
