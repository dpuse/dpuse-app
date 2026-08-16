<script setup lang="ts">
// ── Local Framework
import T from './StudioHomeLayout.json';
import { t } from '@/state/locale';
import { useStudioOptions } from '@/studio/useStudioOptions.ts';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ConfigCard from '@/components/framework/ConfigCard.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '../StudioHeader.vue';
import StudioLayout from '../StudioLayout.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const studioOptionConfigs = useStudioOptions();
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader :title="t(T, 'wb.wf.label')" />

        <Separator class="mx-4" />

        <!-- Workflow Steps -->
        <ScrollArea class="flex-1" scroll-area-padding="screen">
            <div class="max-w-4xl">
                <h2 class="mt-4 ml-4">Workflow</h2>

                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                    <Button
                        v-for="config in studioOptionConfigs.slice(0, 3)"
                        :key="config.id"
                        class="mt-4 ml-4"
                        shape="minimal"
                        :to="{ name: config.id, query: { ...$route.query, sView: config.id } }"
                    >
                        <ConfigCard :config="config" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                    </Button>
                </div>

                <h2 class="mt-4 ml-4">Build Data Apps</h2>
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                    <Button
                        v-for="config in studioOptionConfigs.slice(3, 4)"
                        :key="config.id"
                        class="mt-4 ml-4"
                        shape="minimal"
                        :to="{ name: config.id, query: { ...$route.query, sView: config.id } }"
                    >
                        <ConfigCard :config="config" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                    </Button>
                </div>

                <h2 class="mt-4 ml-4">Configuration</h2>
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                    <Button
                        v-for="config in studioOptionConfigs.slice(4)"
                        :key="config.id"
                        class="mt-4 ml-4"
                        shape="minimal"
                        :to="{ name: config.id, query: { ...$route.query, sView: config.id } }"
                    >
                        <ConfigCard :config="config" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                    </Button>
                </div>
            </div>
        </ScrollArea>
    </StudioLayout>
</template>
