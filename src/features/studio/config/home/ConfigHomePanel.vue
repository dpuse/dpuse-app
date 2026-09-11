<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { configOptionLocalisedConfigs } = defineProps<{ configOptionLocalisedConfigs: LocalisedConfig<ConfigOptionConfig>[] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const moduleOptionLocalisedConfigs = computed(() => configOptionLocalisedConfigs.slice(1));
</script>

<template>
    <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
        <div class="grid max-w-4xl grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 pt-4 pl-4">
            <ConfigCard v-for="config in moduleOptionLocalisedConfigs" :key="config.id" :config="config" :to="{ name: config.to, query: $route.query }" />
        </div>
    </ScrollArea>
</template>
