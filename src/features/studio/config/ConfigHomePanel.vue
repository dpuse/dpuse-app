<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { configOptionLocalisedConfigs } = defineProps<{
    activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig>;
    configOptionLocalisedConfigs: LocalisedConfig<ConfigOptionConfig>[];
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const buttonConfigOptionConfigs = computed(() => configOptionLocalisedConfigs.slice(1));
</script>

<template>
    <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
        <div class="max-w-4xl">
            <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                <Button
                    v-for="config in buttonConfigOptionConfigs"
                    :key="config.id"
                    class="mt-4 ml-4"
                    shape="minimal"
                    :to="{ name: config.to, query: { ...$route.query, sView: config.to } }"
                >
                    <ConfigCard :config="config" />
                </Button>
            </div>
        </div>
    </ScrollArea>
</template>
