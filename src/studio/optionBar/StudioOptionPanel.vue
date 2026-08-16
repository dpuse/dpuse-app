<script setup lang="ts">
// ── External Dependencies & Registrations
import { type ComponentPublicInstance, onUnmounted, ref, useTemplateRef } from 'vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { activeStudioOptionConfig } from '@/state/activeStudioOption';
import T from './StudioOptionPanel.json';
import { t } from '@/state/locale';
import { type StudioOptionConfig, useStudioOptions } from '@/studio/useStudioOptions';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHomeIcon from '@/components/icons/StudioHomeIcon.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const emit = defineEmits<{ continue: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const homeMenuIsOpen = ref(false);
const homeMenuReference = useTemplateRef<ComponentPublicInstance>('homeMenuReference');
const workflowOptionConfigs = useStudioOptions();

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

const handleDocumentPointerDown = (event: PointerEvent): void => {
    if (!homeMenuIsOpen.value) return;
    const target = event.target as Element;
    if ((homeMenuReference.value?.$el as Element | undefined)?.contains(target) === true) return;
    if (target.closest('.dpuse-outside-click-ignore')) return;
    homeMenuIsOpen.value = false;
};
document.addEventListener('pointerdown', handleDocumentPointerDown, { capture: true });
onUnmounted(() => document.removeEventListener('pointerdown', handleDocumentPointerDown, { capture: true }));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleComplete(config?: LocalisedConfig<StudioOptionConfig>): void {
    // if (config != null) setActiveStudioOption(config);
    if (config != null) activeStudioOptionConfig.value = config;
    emit('continue');
}
</script>

<template>
    <nav
        aria-label="Studio options"
        class="mt-[env(safe-area-inset-top)] flex h-full w-[calc(env(safe-area-inset-left)+65px)] flex-col border-r border-separator bg-backdrop pt-[calc(55px)] pb-[calc(var(--vertical-scroll-bottom-screen-inset)+env(safe-area-inset-top))] pl-[env(safe-area-inset-left)]"
        data-region="StudioOptionPanel"
    >
        <!-- Separator -->
        <div class="mx-3 h-px flex-none bg-separator" />

        <!-- Studio options scroller -->
        <ScrollArea class="flex-1">
            <div class="flex flex-col items-center gap-y-2 py-2">
                <Button
                    :aria-label="t(T, 'home.aria')"
                    shape="icon"
                    :to="{ name: 'studio', query: { ...$route.query, sView: 'studio' } }"
                    @click="handleComplete({ id: 'home', label: '', description: '', icon: '', iconDark: null, step: 0, tasks: [] })"
                >
                    <!-- <HomeIcon aria-hidden="true" class="[&>path]:stroke-1.25" /> -->
                    <StudioHomeIcon aria-hidden="true" />
                </Button>

                <template v-for="config in workflowOptionConfigs" :key="config.id">
                    <!-- <Separator v-if="index === 0" class="w-10 flex-none" /> -->

                    <Button :aria-label="config.label" shape="icon" :to="{ name: config.id, query: { ...$route.query, sView: config.id } }" @click="handleComplete(config)">
                        <div aria-hidden="true" v-html="config.icon" />
                    </Button>
                </template>
            </div>
        </ScrollArea>

        <Separator class="mx-3" />
    </nav>
</template>
