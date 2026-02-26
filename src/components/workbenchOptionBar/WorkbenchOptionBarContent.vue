<script setup lang="ts">
// External dependencies
// import { HomeIcon } from '@heroicons/vue/24/outline';
import { useRoute } from 'vue-router';

// App core
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import { useKnowledge } from '@/composables/useKnowledge';

// App components
import AccountButton from '@/components/account/AccountButton.vue';
import ActionRouterLink from '@/components/action/ActionRouterLink.vue';

// Properties
defineProps<{ sessionIsAuthenticated?: boolean; onSelect: (config?: BenchtopOptionLocalisedConfig) => void }>();

// Active localised benchtop configuration
const activeBenchtopConfig = useKnowledge().getBenchtopConfig('workflow', 'en');

// Local route state
const route = useRoute();
</script>

<template>
    <div class="bg-backdrop border-boundary h-full w-16 flex-col border-r pt-13.75">
        <!-- Separator -->
        <div class="bg-separator mx-3 h-px" />

        <!-- Benchtop options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none px-3 pt-2 pb-6">
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

            <!-- Account option -->
            <AccountButton :session-is-authenticated="sessionIsAuthenticated" :on-select="onSelect" />
        </div>
    </div>
</template>
