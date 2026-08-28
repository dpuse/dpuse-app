<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';
import { useStudioOptions } from '@/studio/optionBar/useStudioOptions.ts';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/studio/components/StudioHeader.vue';
import StudioLayout from '@/studio/components/StudioLayout.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Studio: { en: 'Studio', es: 'Estudio' },
    'Step_{number}': { en: 'Step {number}', es: 'Paso {number}' }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const studioOptionConfigs = useStudioOptions();
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader :title="t(T, 'Studio')" />

        <Separator />

        <!-- Workflow Steps -->
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <!-- Every section shares one track definition so a card is the same width in all of them, and each section's
                 intro paragraph spans the columns its cards leave free rather than claiming a track of its own — as a
                 grid item it would take a full column and widen the remaining cards. Breakpoints are container queries
                 (the pane, not the viewport, decides how many cards fit) at the widths a 16rem card plus a 1rem gap
                 needs: 33rem for two columns, 50rem for three. An auto-fit track list would size the same but leaves the
                 column count implicit, and a 2-column span inside a collapsed single-column grid would then spill into
                 an implicit track. -->
            <div class="@container max-w-4xl px-4">
                <h2 class="my-4 border-b border-separator pb-2">Workflow</h2>

                <div class="grid grid-cols-1 gap-4 @min-[33rem]:grid-cols-2 @min-[50rem]:grid-cols-3">
                    <p class="col-span-full text-sm text-muted">
                        Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.
                    </p>

                    <Button
                        v-for="config in studioOptionConfigs.slice(0, 3)"
                        :key="config.id"
                        shape="minimal"
                        :to="{ name: config.id, query: { ...$route.query, sView: config.id } }"
                    >
                        <ConfigCard :config="config" :overline="t(T, 'Step_{number}', { number: config.step })" />
                    </Button>
                </div>

                <h2 class="my-4 border-b border-separator pb-2">Build Data Apps</h2>

                <div class="grid grid-cols-1 gap-4 @min-[33rem]:grid-cols-2 @min-[50rem]:grid-cols-3">
                    <p class="col-span-full self-center text-sm text-muted @min-[50rem]:col-span-2">
                        Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.
                    </p>

                    <Button
                        v-for="config in studioOptionConfigs.slice(3, 4)"
                        :key="config.id"
                        shape="minimal"
                        :to="{ name: config.id, query: { ...$route.query, sView: config.id } }"
                    >
                        <ConfigCard :config="config" :overline="t(T, 'Step_{number}', { number: config.step })" />
                    </Button>
                </div>

                <h2 class="my-4 border-b border-separator pb-2">Configuration</h2>

                <div class="grid grid-cols-1 gap-4 @min-[33rem]:grid-cols-2 @min-[50rem]:grid-cols-3">
                    <p class="col-span-full self-center text-sm text-muted @min-[50rem]:col-span-2">
                        Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.
                    </p>

                    <Button v-for="config in studioOptionConfigs.slice(4)" :key="config.id" shape="minimal" :to="{ name: config.id, query: { ...$route.query, sView: config.id } }">
                        <ConfigCard :config="config" :overline="t(T, 'Step_{number}', { number: config.step })" />
                    </Button>
                </div>
            </div>
        </ScrollArea>
    </StudioLayout>
</template>
