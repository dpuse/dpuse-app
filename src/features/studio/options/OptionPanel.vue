<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { activeStudioOptionConfig } from '@/state/activeStudioOption';
import { isPWA } from '@/state/appLayout';
import { isSafariBrowser } from '@/utilities/index.ts';
import { t } from '@/state/locale';
import { type StudioOptionConfig, useStudioOptions } from './useStudioOptions';

// ── Static Components
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';
import IconButton from '@/components/ui/action/IconButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHomeIcon from '@/components/icons/StudioHomeIcon.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'home.aria': { en: 'Home', es: 'Inicio' },
    'studioOptions.aria': { en: 'Studio options', es: 'Opciones del estudio' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{ continue: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const workflowOptionConfigs = useStudioOptions();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Taken from the first path segment rather than the exact route, so an option stays selected on the pages beneath it.
const selectedOptionId = computed(() => route.path.split('/', 2)[1] || 'home');

// Safari tints its toolbar to match the page, and the installed app runs under a translucent status bar, so neither
// shows where the page starts without a line of its own. Chrome and Edge draw their own toolbar edge. The installed app
// is checked separately because it leaves Safari out of its user agent.
const hasTopEdgeLine = isPWA || isSafariBrowser();

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleComplete(config?: LocalisedConfig<StudioOptionConfig>): void {
    if (config != null) activeStudioOptionConfig.value = config;
    emit('continue');
}
</script>

<template>
    <nav
        :aria-label="t(TEXT, 'studioOptions.aria')"
        class="mt-[env(safe-area-inset-top)] flex h-full w-[calc(env(safe-area-inset-left)+65px)] flex-col border-t border-r border-r-separator bg-backdrop pt-13.5 pb-[calc(var(--vertical-bottom-screen-inset)+env(safe-area-inset-top))] pl-[env(safe-area-inset-left)]"
        :class="hasTopEdgeLine ? 'border-t-separator' : 'border-t-transparent'"
        data-region="OptionPanel"
    >
        <!-- Separator -->
        <Separator />

        <!-- Studio options scroller -->
        <ScrollArea class="flex-1" :scroll-area-padding-right="0">
            <div class="flex flex-col items-center gap-y-2 py-2">
                <IconButton
                    :accessible-label="t(TEXT, 'home.aria')"
                    :aria-current="selectedOptionId === 'home' ? 'page' : undefined"
                    :is-active="selectedOptionId === 'home'"
                    :to="{ name: 'studio', query: $route.query }"
                    @click="handleComplete({ id: 'home', label: '', description: '', icon: '', iconDark: null, step: 0, tasks: [] })"
                >
                    <StudioHomeIcon aria-hidden="true" />
                </IconButton>

                <template v-for="config in workflowOptionConfigs" :key="config.id">
                    <IconButton
                        :accessible-label="config.label"
                        :aria-current="selectedOptionId === config.id ? 'page' : undefined"
                        :is-active="selectedOptionId === config.id"
                        :to="{ name: config.id, query: $route.query }"
                        @click="handleComplete(config)"
                    >
                        <ConfigIcon class="size-5.5" :icon="config.icon" :icon-dark="config.iconDark" />
                    </IconButton>
                </template>
            </div>
        </ScrollArea>

        <Separator />
    </nav>
</template>
