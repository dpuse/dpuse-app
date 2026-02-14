<script setup lang="ts">
// External dependencies
// import { HomeIcon } from 'lucide-vue-next';
import { HomeIcon } from '@heroicons/vue/24/outline';

// Workbench core
import { useKnowledge } from '@/composables/useKnowledge';

// Workbench components
import IconActionContent from '@/components/base/IconActionContent.vue';
import OptionAccountAction from './OptionAccountAction.vue';

// Properties
defineProps<{ sessionIsAuthenticated?: boolean; onSelect: () => void }>();

// Active localised benchtop configuration
const activeBenchtopConfig = useKnowledge().getBenchtopConfig('workflow', 'en');
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- Separator -->
        <div class="bg-separator mx-3 h-px" />

        <!-- Benchtop options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none px-3 pt-2 pb-6">
            <div class="flex w-full flex-1 flex-col items-center gap-y-2">
                <RouterLink :aria-label="activeBenchtopConfig.label" class="group outline-none" :to="{ name: activeBenchtopConfig.id }" @click="onSelect">
                    <IconActionContent>
                        <HomeIcon aria-hidden="true" class="size-6" :stroke-width="1.25" />
                    </IconActionContent>
                </RouterLink>

                <RouterLink
                    v-for="config of activeBenchtopConfig.options"
                    :key="config.id"
                    :aria-label="config.label"
                    class="group outline-none"
                    :to="{ name: config.id }"
                    @click="onSelect"
                >
                    <IconActionContent>
                        <div aria-hidden="true" class="size-6" :style="{ color: `${config.color}` }" v-html="config.icon" />
                    </IconActionContent>
                </RouterLink>
            </div>

            <!-- Account option -->
            <OptionAccountAction :session-is-authenticated="sessionIsAuthenticated" :on-select="onSelect" />
        </div>
    </div>
</template>
