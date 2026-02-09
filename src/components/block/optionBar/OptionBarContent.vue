<script setup lang="ts">
// Vendor dependencies
import { LayoutDashboardIcon } from 'lucide-vue-next';

// Workbench core
import { useKnowledge } from '@/composables/useKnowledge';

// Workbench components
import OptionAccountAction from './OptionAccountAction.vue';
import { UserCogIcon } from 'lucide-vue-next';

// Properties
defineProps<{ sessionIsAuthenticated?: boolean; onSelect: () => void }>();

// Constants
const CLASSES =
    'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 flex h-10 w-10 flex-none items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500';

// Active localised benchtop configuration
const activeBenchtopConfig = useKnowledge().getBenchtopConfig('workflow', 'en');
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- Separator -->
        <div class="bg-separator mx-3 h-px" />

        <!-- Benchtop options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none px-3 pt-2 pb-3">
            <div class="flex w-full flex-1 flex-col items-center">
                <RouterLink :aria-label="activeBenchtopConfig.label" :class="CLASSES" :to="{ name: activeBenchtopConfig.id }" @click="onSelect">
                    <LayoutDashboardIcon aria-hidden="true" class="size-6" :stroke-width="1.25" />
                </RouterLink>

                <RouterLink v-for="config of activeBenchtopConfig.options" :key="config.id" :aria-label="config.label" :class="CLASSES" :to="{ name: config.id }" @click="onSelect">
                    <div aria-hidden="true" class="size-6" :style="{ color: `${config.color}` }" v-html="config.icon" />
                </RouterLink>
            </div>

            <!-- Account option -->
            <!-- <OptionAccountAction :session-is-authenticated="sessionIsAuthenticated" :on-select="onSelect" /> -->
            <RouterLink :class="CLASSES" :to="{ name: 'account' }" @click="onSelect">
                <UserCogIcon class="size-6" :stroke-width="1.25" />
            </RouterLink>
        </div>
    </div>
</template>
