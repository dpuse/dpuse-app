<script setup lang="ts">
// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { T } from './StudioHomePanel_.json';
import { t } from '@/state/locale';
import { useStudioOptions } from '@/features/studio/options/useStudioOptions.ts';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const studioOptionConfigs = useStudioOptions();

// ── State - Studio Option Groupings ──────────────────────────────────────────────────────────────────────────────────

const buildDataAppsOptionConfig = assertDefined(
    studioOptionConfigs.value.find((config) => config.id === 'dataApps'),
    "Expected a 'dataApps' entry from useStudioOptions()."
);
const setupOptionConfig = assertDefined(
    studioOptionConfigs.value.find((config) => config.id === 'setup'),
    "Expected a 'setup' entry from useStudioOptions()."
);
const workflowOptionConfigs = studioOptionConfigs.value.filter((config) => config.step > 0);
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader :title="t(T, 'studio.title')" />

        <!-- Body -->
        <Separator />
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <div class="@container max-w-4xl pl-4">
                <!-- Workflow -->
                <div class="my-4 border-b border-separator pb-1.5">{{ t(T, 'workflow.title') }}</div>
                <div class="grid grid-cols-1 gap-4 @min-[33rem]:grid-cols-2 @min-[50rem]:grid-cols-3">
                    <div class="col-span-full self-start text-sm text-muted">{{ t(T, 'workflow.text') }}</div>
                    <ConfigCard
                        v-for="config in workflowOptionConfigs"
                        :key="config.id"
                        :config="config"
                        :overline="t(T, 'step.label', { number: config.step })"
                        :to="{ name: config.id, query: $route.query }"
                    />
                </div>

                <!-- Build Data Apps -->
                <div class="mt-6 mb-4 border-b border-separator pb-1.5">{{ t(T, 'buildDataApps.title') }}</div>
                <div class="grid grid-cols-1 gap-4 @min-[33rem]:grid-cols-2 @min-[50rem]:grid-cols-3">
                    <div class="col-span-full self-start text-sm text-muted @min-[50rem]:col-span-2">{{ t(T, 'buildDataApps.text') }}</div>
                    <ConfigCard :config="buildDataAppsOptionConfig" :to="{ name: buildDataAppsOptionConfig.id, query: $route.query }" />
                </div>

                <!-- Configuration -->
                <div class="mt-6 mb-4 border-b border-separator pb-2">{{ t(T, 'configuration.title') }}</div>
                <div class="grid grid-cols-1 gap-4 @min-[33rem]:grid-cols-2 @min-[50rem]:grid-cols-3">
                    <div class="col-span-full self-start text-sm text-muted @min-[50rem]:col-span-2">{{ t(T, 'configuration.text') }}</div>
                    <ConfigCard :config="setupOptionConfig" :to="{ name: setupOptionConfig.id, query: $route.query }" />
                </div>
            </div>
        </ScrollArea>
    </StudioLayout>
</template>
