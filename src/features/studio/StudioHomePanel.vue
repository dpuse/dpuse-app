<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { computed, useId } from 'vue';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { t } from '@/state/locale';
import { TEXT } from './StudioHomePanel_.json';
import { useStudioOptions } from '@/features/studio/options/useStudioOptions.ts';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const studioOptionConfigs = useStudioOptions(); // Changes when locale changes.
const headingIdPrefix = useId(); // Keeps each heading's id unique on the page, for 'aria-labelledby'.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Option Configurations by Section
const workflowOptionConfigs = computed(() => studioOptionConfigs.value.filter((config) => config.step > 0));
const buildDataAppsOptionConfig = computed(() =>
    assertDefined(
        studioOptionConfigs.value.find((config) => config.id === 'dataApps'),
        "Expected a 'dataApps' entry from useStudioOptions()."
    )
);
const setupOptionConfig = computed(() =>
    assertDefined(
        studioOptionConfigs.value.find((config) => config.id === 'setup'),
        "Expected a 'setup' entry from useStudioOptions()."
    )
);

// ── Sections ─ The page's sections, in order. Only the workflow cards are numbered steps.
const sections = computed(() => [
    { id: 'workflow', configs: workflowOptionConfigs.value, showsSteps: true, textKey: 'workflow.text', titleKey: 'workflow.title' },
    { id: 'buildDataApps', configs: [buildDataAppsOptionConfig.value], showsSteps: false, textKey: 'buildDataApps.text', titleKey: 'buildDataApps.title' },
    { id: 'configuration', configs: [setupOptionConfig.value], showsSteps: false, textKey: 'configuration.text', titleKey: 'configuration.title' }
]);
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader :title="t(TEXT, 'studio.title')" />

        <!-- Body -->
        <Separator />
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <div class="@container max-w-4xl pl-4">
                <!-- A section with a single card puts its text beside the card on wide screens, rather than
                     above it. -->
                <section v-for="section in sections" :key="section.id" :aria-labelledby="`${headingIdPrefix}-${section.id}`" class="mt-6 first:mt-4">
                    <h2 :id="`${headingIdPrefix}-${section.id}`" class="mb-4 border-b border-separator pb-1.5">{{ t(TEXT, section.titleKey) }}</h2>
                    <div class="grid grid-cols-1 gap-4 @min-[33rem]:grid-cols-2 @min-[50rem]:grid-cols-3">
                        <p class="col-span-full self-start text-sm text-muted" :class="{ '@min-[50rem]:col-span-2': section.configs.length === 1 }">
                            {{ t(TEXT, section.textKey) }}
                        </p>
                        <ConfigCard
                            v-for="config in section.configs"
                            :key="config.id"
                            :config="config"
                            :overline="section.showsSteps ? t(TEXT, 'step.label', { number: config.step }) : undefined"
                            :to="{ name: config.id, query: route.query }"
                        />
                    </div>
                </section>
            </div>
        </ScrollArea>
    </StudioLayout>
</template>
