<script setup lang="ts">
// ── API Framework
import { useConfigOptionConfigs } from '../useConfigOptionConfigs';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ConfigCard from '@/components/framework/ConfigCard.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const configOptionConfigs = useConfigOptionConfigs().value.splice(1);
</script>

<template>
    <ScrollArea class="flex-1" scroll-area-padding="screen">
        <div class="max-w-4xl">
            <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
                <Button
                    v-for="config in configOptionConfigs"
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
