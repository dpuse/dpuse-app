<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';
import { useOptions } from '@/features/studio/options/useOptions.ts';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'buildDataApps.title': { en: 'Build Data Apps', es: 'Crear Aplicaciones de Datos' },
    'buildDataApps.text': {
        en: 'Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.',
        es: 'Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.'
    },
    'configuration.title': { en: 'Configuration', es: 'Configuración' },
    'configuration.text': {
        en: 'Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.',
        es: 'Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.'
    },
    'step.label': { en: 'Step {number}', es: 'Paso {number}' },
    'studio.title': { en: 'Studio', es: 'Estudio' },
    'workflow.title': { en: 'Workflow', es: 'Flujo de Trabajo' },
    'workflow.text': {
        en: 'Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.',
        es: 'Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.'
    }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const studioOptionConfigs = useOptions();

const workflowOptionConfigs = studioOptionConfigs.value.slice(0, 3);
const buildDataAppsOptionConfig = studioOptionConfigs.value[3];
const configOptionConfig = studioOptionConfigs.value[4];
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
                        :to="{ name: config.id, query: { ...$route.query, sView: config.id } }"
                    />
                </div>

                <!-- Build Data Apps -->
                <div class="mt-6 mb-4 border-b border-separator pb-1.5">{{ t(T, 'buildDataApps.title') }}</div>
                <div class="grid grid-cols-1 gap-4 @min-[33rem]:grid-cols-2 @min-[50rem]:grid-cols-3">
                    <div class="col-span-full self-start text-sm text-muted @min-[50rem]:col-span-2">{{ t(T, 'buildDataApps.text') }}</div>
                    <ConfigCard
                        :key="buildDataAppsOptionConfig.id"
                        :config="buildDataAppsOptionConfig"
                        :to="{ name: buildDataAppsOptionConfig.id, query: { ...$route.query, sView: buildDataAppsOptionConfig.id } }"
                    />
                </div>

                <!-- Configuration -->
                <div class="mt-6 mb-4 border-b border-separator pb-2">{{ t(T, 'configuration.title') }}</div>
                <div class="grid grid-cols-1 gap-4 @min-[33rem]:grid-cols-2 @min-[50rem]:grid-cols-3">
                    <div class="col-span-full self-start text-sm text-muted @min-[50rem]:col-span-2">{{ t(T, 'configuration.text') }}</div>
                    <ConfigCard
                        :key="configOptionConfig.id"
                        :config="configOptionConfig"
                        :to="{ name: configOptionConfig.id, query: { ...$route.query, sView: configOptionConfig.id } }"
                    />
                </div>
            </div>
        </ScrollArea>
    </StudioLayout>
</template>
