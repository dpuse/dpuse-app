<script setup lang="ts">
// DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local (App) Framework
import type { BenchtopOptionConfig } from '@/domains/workbench/workbench';
import { setActiveBenchtop } from '@/state/activeBenchtop';
import T from './WorkbenchOptionPanel.json';
import { t } from '@/state/locale';
import { useWorkflowOptionConfigs } from '@/domains/workbench/workflow/useWorkflowOptionConfigs';

// Local Components - Static
import HomeIcon from '@/components/icons/HomeIcon.vue';
import ScrollArea from '@/components/layout/scrollArea/ScrollArea.vue';
import Separator from '@/components/ui/separator/Separator.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{ continue: [] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const workflowOptionConfigs = useWorkflowOptionConfigs();

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleComplete(config?: LocalisedConfig<BenchtopOptionConfig>): void {
    if (config != null) setActiveBenchtop(config);
    emit('continue');
}
</script>

<template>
    <aside
        class="border-boundary bg-backdrop pl-[env(safe-area-inset-left) flex h-full w-16.25 flex-col border-r pt-[calc(env(safe-area-inset-top)+55px)] pb-(--vertical-scroll-bottom-screen-inset)"
    >
        <!-- Separator -->
        <div class="bg-separator mx-3 h-px flex-none" />

        <!-- Benchtop options scroller -->
        <ScrollArea class="flex-1">
            <div class="flex flex-col items-center gap-y-2 py-2">
                <RouterLink
                    :aria-label="t(T, 'home.aria')"
                    class="dpuse-lg rounded-md p-1.75 transition-[background-color] duration-150 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:hover:bg-zinc-500/40 dark:focus-visible:outline-zinc-400"
                    :to="{ name: 'workflow', query: { ...$route.query, wbView: 'workflow' } }"
                    variant="iconLarge"
                    @click="handleComplete({ id: 'home', label: '', color: '', description: '', icon: '', step: 0, tasks: [] })"
                >
                    <HomeIcon aria-hidden="true" class="[&>path]:stroke-[1.25]" />
                </RouterLink>

                <RouterLink
                    v-for="config in workflowOptionConfigs"
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
        </ScrollArea>

        <Separator class="mx-3" />
    </aside>
</template>

<style scoped>
a.dpuse-lg :deep(svg) {
    width: 26px;
    height: 26px;
}
</style>
