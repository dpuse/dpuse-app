<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '../ManageConfigLayout.vue';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ConfigCard from '@/components/framework/ConfigCard.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { configOptionLocalisedConfigs } = defineProps<{
    activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig>;
    configOptionLocalisedConfigs: LocalisedConfig<ConfigOptionConfig>[];
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const buttonConfigOptionConfigs = computed(() => configOptionLocalisedConfigs.slice(1));
</script>

<template>
    <ScrollArea class="flex-1" scroll-area-padding="screen">
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
