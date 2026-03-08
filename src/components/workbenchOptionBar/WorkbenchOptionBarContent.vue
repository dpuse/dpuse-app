<script setup lang="ts">
// External Dependencies
import { HomeIcon } from '@heroicons/vue/24/outline';
import { useRoute } from 'vue-router';

// App Core
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import { useKnowledge } from '@/composables/useKnowledge';

// App Components
import ActionRouterLink from '@/components/action/ActionRouterLink.vue';

// Properties & Emits
defineProps<{ onSelect: (config?: BenchtopOptionLocalisedConfig) => void }>();

// Active localised benchtop configuration
const activeBenchtopConfig = useKnowledge().getBenchtopConfig('workflow', 'en');

// Local route state
const route = useRoute();
</script>

<template>
    <div class="border-boundary bg-backdrop h-full w-16.25 flex-col border-r pt-13.75 pb-20.25">
        <!-- Separator -->
        <div class="bg-separator mx-3 h-px" />

        <!-- Benchtop options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none py-2">
            <div class="flex flex-1 flex-col items-center gap-y-2">
                <ActionRouterLink :aria-label="activeBenchtopConfig.label" :to="{ name: activeBenchtopConfig.id, query: route.query }" variant="iconLarge" @click="onSelect()">
                    <HomeIcon aria-hidden="true" class="[&>path]:stroke-[1.25]" />
                </ActionRouterLink>

                <ActionRouterLink
                    v-for="config of activeBenchtopConfig.options"
                    :key="config.id"
                    :aria-label="config.label"
                    class="group outline-none"
                    :to="{ name: config.id, query: route.query }"
                    variant="iconLarge"
                    @click="onSelect(config)"
                >
                    <div aria-hidden="true" :style="{ color: `${config.color}` }" v-html="config.icon" />
                </ActionRouterLink>
            </div>
        </div>
    </div>
</template>
