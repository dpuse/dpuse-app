<script setup lang="ts">
// ── Local Framework
import { useConfigOptionConfigs } from '../useConfigOptionConfigs';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Card from '@/components/ui/Card.vue';
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
                    <Card :description="config.description" :icon="config.icon" :label="config.label" />
                </Button>
            </div>
        </div>
    </ScrollArea>
</template>
