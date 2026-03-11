<script setup lang="ts">
// External Dependencies
import { HomeIcon } from '@heroicons/vue/24/outline';
import { useRoute } from 'vue-router';
import { ref, watch } from 'vue';

// App Core
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import { localeId } from '~/src/locales';
import { useKnowledge } from '@/composables/useKnowledge';

// Properties & Emits
const emit = defineEmits<{ (event: 'complete', config?: BenchtopOptionLocalisedConfig): void }>();

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

// Local States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeBenchtopConfig = ref();
watch(
    localeId,
    (newLocaleId) =>
        useKnowledge()
            .getBenchtopConfig('workflow', newLocaleId)
            .then((response) => (activeBenchtopConfig.value = response)),
    { immediate: true }
);

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleComplete(config?: BenchtopOptionLocalisedConfig): void {
    emit('complete', config);
}
</script>

<template>
    <div class="border-boundary bg-backdrop h-full w-16.25 flex-col border-r pt-13.75 pb-20.25">
        <!-- Separator -->
        <div class="bg-separator mx-3 h-px" />

        <!-- Benchtop options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none py-2">
            <div v-if="activeBenchtopConfig" class="flex flex-1 flex-col items-center gap-y-2">
                <RouterLink
                    :aria-label="activeBenchtopConfig.label"
                    class="dpuse-lg rounded-md p-1.75 transition-[background-color] duration-150 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:hover:bg-zinc-500/40 dark:focus-visible:outline-zinc-400"
                    :to="{ name: 'workflow', query: route.query }"
                    variant="iconLarge"
                    @click="handleComplete({ id: 'home', label: '', color: '', description: '', icon: '', step: 0, tasks: [] })"
                >
                    <HomeIcon aria-hidden="true" class="[&>path]:stroke-[1.25]" />
                </RouterLink>

                <RouterLink
                    v-for="config of activeBenchtopConfig.options"
                    :key="config.id"
                    :aria-label="config.label"
                    class="dpuse-lg rounded-md p-1.75 transition-[background-color] duration-150 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:hover:bg-zinc-500/40 dark:focus-visible:outline-zinc-400"
                    :to="{ name: config.id, query: route.query }"
                    variant="iconLarge"
                    @click="handleComplete(config)"
                >
                    <div aria-hidden="true" :style="{ color: `${config.color}` }" v-html="config.icon" />
                </RouterLink>
            </div>
        </div>
    </div>
</template>

<style scoped>
a.dpuse-lg :deep(svg) {
    width: 26px;
    height: 26px;
}
</style>
