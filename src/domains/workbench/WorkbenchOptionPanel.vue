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
import Button from '@/components/ui/button/Button.vue';
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
        class="border-boundary bg-backdrop flex h-full w-[calc(env(safe-area-inset-left)+4.0625rem)] flex-col border-r pt-[calc(env(safe-area-inset-top)+55px)] pb-(--vertical-scroll-bottom-screen-inset) pl-[env(safe-area-inset-left)]"
    >
        <!-- Separator -->
        <div class="bg-separator mx-3 h-px flex-none" />

        <!-- Benchtop options scroller -->
        <ScrollArea class="flex-1">
            <div class="flex flex-col items-center gap-y-2 py-2">
                <Button
                    :aria-label="t(T, 'home.aria')"
                    shape="icon"
                    :to="{ name: 'workflow', query: { ...$route.query, wbView: 'workflow' } }"
                    @click="handleComplete({ id: 'home', label: '', color: '', description: '', icon: '', step: 0, tasks: [] })"
                >
                    <HomeIcon aria-hidden="true" class="[&>path]:stroke-[1.25]" />
                </Button>

                <Button
                    v-for="config in workflowOptionConfigs"
                    :key="config.id"
                    :aria-label="config.label"
                    shape="icon"
                    :to="{ name: config.id, query: { ...$route.query, wbView: config.id } }"
                    @click="handleComplete(config)"
                >
                    <div aria-hidden="true" :style="{ color: `${config.color}` }" v-html="config.icon" />
                </Button>
            </div>
        </ScrollArea>

        <Separator class="mx-3" />
    </aside>
</template>
