<script setup lang="ts">
// Application core
import { useKnowledge } from '@/composables/useKnowledge';

// Components
import Header from '@/components/block/header/Header.vue';

// Properties
type Properties = { isDisplayWide: boolean };
const properties = defineProps<Properties>();

const activeBenchtopConfig = useKnowledge().getBenchtopConfig('workflow', 'en') ?? {
    primaryOptions: [],
    secondaryOptions: []
};
</script>

<template>
    <div class="flex h-full flex-col rounded-b-lg border-x border-b">
        <Header title="Workflow" :is-display-wide="properties.isDisplayWide" />

        <div class="flex-1 overflow-y-auto overscroll-y-none">
            <div class="grid grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4 p-4">
                <div
                    v-for="optionConfig of activeBenchtopConfig.primaryOptions"
                    :key="optionConfig.id"
                    class="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10"
                >
                    <div class="px-4 py-5 sm:px-6">
                        {{ optionConfig.label }}
                        <!-- We use less vertical padding on card headers on desktop than on body sections -->
                    </div>
                    <div class="px-4 py-5 sm:p-6">
                        <!-- Content goes here -->
                    </div>
                    <div class="px-4 py-4 sm:px-6">
                        <!-- Content goes here -->
                        <!-- We use less vertical padding on card footers at all sizes than on headers or body sections -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
