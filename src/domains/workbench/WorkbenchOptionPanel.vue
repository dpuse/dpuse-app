<script setup lang="ts">
// External Dependencies
import { ChevronDownIcon } from 'lucide-vue-next';
import { type ComponentPublicInstance, defineAsyncComponent, onUnmounted, ref, useTemplateRef } from 'vue';

// DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local (App) Framework
import { activeBenchtopOptionConfig } from '@/state/activeBenchtop';
import type { BenchtopOptionConfig } from '@/domains/workbench/workbench';
import { load } from '@/state/component';
import T from './WorkbenchOptionPanel.json';
import { t } from '@/state/locale';
import { useWorkbenchOptionConfigs } from '@/domains/workbench/useWorkbenchOptionConfigs';
import { viewportIsWide } from '@/state/appLayout';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import HomeIcon from '@/components/icons/HomeIcon.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';

// Local Components - Dynamic
const HomeMenu = defineAsyncComponent(load('HomeMenu', () => import('@/domains/workbench/HomeMenu.vue')));

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{ continue: [] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const homeMenuIsOpen = ref(false);
const homeMenuReference = useTemplateRef<ComponentPublicInstance>('homeMenuReference');
const workflowOptionConfigs = useWorkbenchOptionConfigs();

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

const handleDocumentPointerDown = (event: PointerEvent): void => {
    if (!homeMenuIsOpen.value) return;
    const target = event.target as Element;
    if ((homeMenuReference.value?.$el as Element | undefined)?.contains(target) === true) return;
    if (target.closest('.dpuse-outside-click-ignore')) return;
    homeMenuIsOpen.value = false;
};
document.addEventListener('pointerdown', handleDocumentPointerDown, { capture: true });
onUnmounted(() => document.removeEventListener('pointerdown', handleDocumentPointerDown, { capture: true }));

// UI Handlers ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleComplete(config?: LocalisedConfig<BenchtopOptionConfig>): void {
    // if (config != null) setActiveBenchtopOption(config);
    if (config != null) activeBenchtopOptionConfig.value = config;
    emit('continue');
}
</script>

<template>
    <nav
        aria-label="Workbench options"
        class="mt-[env(safe-area-inset-top)] flex h-full w-[calc(env(safe-area-inset-left)+65px)] flex-col border-r border-boundary bg-backdrop pt-[calc(55px)] pb-[calc(var(--vertical-scroll-bottom-screen-inset)+env(safe-area-inset-top))] pl-[env(safe-area-inset-left)]"
        data-region="WorkbenchOptionPanel"
    >
        <!-- Separator -->
        <div class="mx-3 h-px flex-none bg-separator" />

        <!-- Benchtop options scroller -->
        <ScrollArea class="flex-1">
            <div class="flex flex-col items-center gap-y-2 py-2">
                <div class="relative flex flex-col">
                    <Button
                        :aria-label="t(T, 'home.aria')"
                        shape="icon"
                        :to="{ name: 'workflow', query: { ...$route.query, wbView: 'workflow' } }"
                        @click="handleComplete({ id: 'home', label: '', description: '', icon: '', step: 0, tasks: [] })"
                    >
                        <HomeIcon aria-hidden="true" class="[&>path]:stroke-[1.25]" />
                    </Button>

                    <Button
                        class="dpuse-outside-click-ignore absolute -right-0.5 -bottom-0.5 rounded-full bg-zinc-200 p-0.5"
                        shape="minimal"
                        @click="homeMenuIsOpen = !homeMenuIsOpen"
                    >
                        <ChevronDownIcon class="size-3.5" />
                    </Button>
                </div>

                <Teleport to="body">
                    <Transition :name="viewportIsWide ? 'dpuse-slide-down' : 'dpuse-sheet'">
                        <HomeMenu v-if="homeMenuIsOpen" ref="homeMenuReference" class="z-51" @continue="homeMenuIsOpen = false" />
                    </Transition>
                </Teleport>

                <Button
                    v-for="config in workflowOptionConfigs"
                    :key="config.id"
                    :aria-label="config.label"
                    shape="icon"
                    :to="{ name: config.id, query: { ...$route.query, wbView: config.id } }"
                    @click="handleComplete(config)"
                >
                    <div aria-hidden="true" v-html="config.icon" />
                </Button>
            </div>
        </ScrollArea>

        <Separator class="mx-3" />
    </nav>
</template>
