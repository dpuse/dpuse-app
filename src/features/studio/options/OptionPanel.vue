<script setup lang="ts">
// ── External Dependencies & Registrations
import { type ComponentPublicInstance, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { activeStudioOptionConfig } from '@/state/activeStudioOption';
import { isPWA } from '@/state/appLayout';
import { t } from '@/state/locale';
import { type StudioOptionConfig, useStudioOptions } from './useStudioOptions';

// ── Static Components
import IconButton from '@/components/ui/action/IconButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHomeIcon from '@/components/icons/StudioHomeIcon.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'home.aria': { en: 'Home', es: 'Inicio' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{ continue: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const homeMenuIsOpen = ref(false);
const homeMenuReference = useTemplateRef<ComponentPublicInstance>('homeMenuReference');
const workflowOptionConfigs = useStudioOptions();

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    document.addEventListener('pointerdown', handleDocumentPointerDown, { capture: true });
});

onUnmounted(() => {
    document.removeEventListener('pointerdown', handleDocumentPointerDown, { capture: true });
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

const handleDocumentPointerDown = (event: PointerEvent): void => {
    if (!homeMenuIsOpen.value) return;
    const target = event.target as Element;
    if ((homeMenuReference.value?.$el as Element | undefined)?.contains(target) === true) return;
    if (target.closest('.dpuse-outside-click-ignore')) return;
    homeMenuIsOpen.value = false;
};

function handleComplete(config?: LocalisedConfig<StudioOptionConfig>): void {
    if (config != null) activeStudioOptionConfig.value = config;
    emit('continue');
}
</script>

<template>
    <nav
        aria-label="Studio options"
        class="mt-[env(safe-area-inset-top)] flex h-full w-[calc(env(safe-area-inset-left)+65px)] flex-col border-t border-r border-r-separator bg-backdrop pt-13.5 pb-[calc(var(--vertical-bottom-screen-inset)+env(safe-area-inset-top))] pl-[env(safe-area-inset-left)]"
        :class="isPWA ? 'border-t-separator' : 'border-t-transparent'"
        data-region="OptionPanel"
    >
        <!-- Separator -->
        <Separator />

        <!-- Studio options scroller -->
        <ScrollArea class="flex-1" :scroll-area-padding-right="0">
            <div class="flex flex-col items-center gap-y-2 py-2">
                <IconButton
                    :accessible-label="t(T, 'home.aria')"
                    :to="{ name: 'studio', query: $route.query }"
                    @click="handleComplete({ id: 'home', label: '', description: '', icon: '', iconDark: null, step: 0, tasks: [] })"
                >
                    <StudioHomeIcon aria-hidden="true" />
                </IconButton>

                <template v-for="config in workflowOptionConfigs" :key="config.id">
                    <IconButton :accessible-label="config.label" :to="{ name: config.id, query: $route.query }" @click="handleComplete(config)">
                        <div aria-hidden="true" v-html="config.icon" />
                    </IconButton>
                </template>
            </div>
        </ScrollArea>

        <Separator />
    </nav>
</template>
