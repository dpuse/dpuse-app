<script setup lang="ts">
// ── External Dependencies & Registrations
import { type ComponentPublicInstance, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { activeStudioOptionConfig } from '@/state/activeStudioOption';
import { t } from '@/state/locale';
import { type StudioOptionConfig, useOptions } from './useOptions';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
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
const workflowOptionConfigs = useOptions();

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
        class="] mt-[env(safe-area-inset-top)] flex h-full w-[calc(env(safe-area-inset-left)+65px)] flex-col border-r border-separator bg-backdrop pt-13.5 pb-[calc(var(--vertical-scroll-bottom-screen-inset)+env(safe-area-inset-top))]"
        data-region="OptionPanel"
    >
        <!-- Separator -->
        <Separator />

        <!-- Studio options scroller -->
        <ScrollArea class="flex-1" :scroll-area-padding-right="0">
            <div class="flex flex-col items-center gap-y-2 py-2">
                <Button
                    :aria-label="t(T, 'home.aria')"
                    shape="icon"
                    :to="{ name: 'studio', query: { ...$route.query, sView: 'studio' } }"
                    @click="handleComplete({ id: 'home', label: '', description: '', icon: '', iconDark: null, step: 0, tasks: [] })"
                >
                    <StudioHomeIcon aria-hidden="true" />
                </Button>

                <template v-for="config in workflowOptionConfigs" :key="config.id">
                    <Button :aria-label="config.label" shape="icon" :to="{ name: config.id, query: { ...$route.query, sView: config.id } }" @click="handleComplete(config)">
                        <div aria-hidden="true" v-html="config.icon" />
                    </Button>
                </template>
            </div>
        </ScrollArea>

        <Separator />
    </nav>
</template>
