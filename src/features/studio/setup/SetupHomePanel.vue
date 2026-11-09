<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { SetupOptionConfig } from '@/features/studio/setup/useSetupOptions';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { setupOptionLocalisedConfigs } = defineProps<{ setupOptionLocalisedConfigs: LocalisedConfig<SetupOptionConfig>[] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const pluginOptionLocalisedConfigs = computed(() => setupOptionLocalisedConfigs.filter((config) => config.id !== 'home'));
</script>

<template>
    <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
        <!-- Width Cap ─ 'max-w-4xl' sits on this wrapper, not the grid. A grid with its own max width counts its 'auto-fit'
             columns from that width, so it would stay three columns wide and scroll sideways in a narrow view. -->
        <div class="max-w-4xl">
            <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 pt-4 pl-page">
                <ConfigCard v-for="config in pluginOptionLocalisedConfigs" :key="config.id" :config="config" :to="{ name: config.to, query: $route.query }" />
            </div>
        </div>
    </ScrollArea>
</template>
