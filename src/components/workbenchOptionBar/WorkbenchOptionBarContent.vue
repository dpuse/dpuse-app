<script setup lang="ts">
// External Dependencies
import { shallowRef, watch } from 'vue';

// App Core
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import { setActiveBenchtop } from '~/src/state/activeBenchtop';
import workflowStepData from '~/knowledge/workbench/benchtops/workflow/workflowSteps.json';
import { localeId, localiseConfigs } from '@/locales';

// App Components - Statically imported so always available, even after app goes offline.
import HomeIcon from '@/components/icon/HomeIcon.vue';
import Separator from '@/components/separator/Separator.vue';

// Properties & Emits
const emit = defineEmits<{ (event: 'continue'): void }>();

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const workflowStepConfigs = shallowRef<BenchtopOptionLocalisedConfig[]>();

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

watch(localeId, (newLocaleId) => (workflowStepConfigs.value = localiseConfigs<BenchtopOptionLocalisedConfig>(workflowStepData, newLocaleId)), { immediate: true });

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleComplete(config?: BenchtopOptionLocalisedConfig): void {
    if (config) setActiveBenchtop(config);
    emit('continue');
}
</script>

<template>
    <div class="border-boundary bg-backdrop h-full w-16.25 flex-col border-r pt-[calc(env(safe-area-inset-top)+55px)] pb-18.5">
        <!-- Separator -->
        <div class="bg-separator mx-3 h-px" />

        <!-- Benchtop options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none py-2">
            <div class="flex flex-1 flex-col items-center gap-y-2">
                <RouterLink
                    class="dpuse-lg rounded-md p-1.75 transition-[background-color] duration-150 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:hover:bg-zinc-500/40 dark:focus-visible:outline-zinc-400"
                    :to="{ name: 'workflow', query: { ...$route.query, wbView: 'workflow' } }"
                    variant="iconLarge"
                    @click="handleComplete({ id: 'home', label: '', color: '', description: '', icon: '', step: 0, tasks: [] })"
                >
                    <HomeIcon aria-hidden="true" class="[&>path]:stroke-[1.25]" />
                </RouterLink>

                <RouterLink
                    v-for="config in workflowStepConfigs"
                    :key="config.id"
                    :aria-label="config.label"
                    class="dpuse-lg rounded-md p-1.75 transition-[background-color] duration-150 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:hover:bg-zinc-500/40 dark:focus-visible:outline-zinc-400"
                    :to="{ name: config.id, query: { ...$route.query, wbView: config.id } }"
                    variant="iconLarge"
                    @click="handleComplete(config)"
                >
                    <div aria-hidden="true" :style="{ color: `${config.color}` }" v-html="config.icon" />
                </RouterLink>
            </div>
        </div>

        <Separator class="mx-3" />
    </div>
</template>

<style scoped>
a.dpuse-lg :deep(svg) {
    width: 26px;
    height: 26px;
}
</style>
