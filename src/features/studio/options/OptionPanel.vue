<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// ── Local Framework
import { t } from '@/state/locale';
import { useStudioOptions } from './useStudioOptions';
import { isPWA, isSafariBrowser } from '@/state/device';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';
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

function handleComplete(): void {
    emit('continue');
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructOptionStateClass(optionId: string): string {
    return optionId === selectedOptionId.value ? 'state-selected hover:state-selected-hover active:state-press' : 'hover:state-hover-row active:state-press';
}
</script>

<template>
    <nav
        :aria-label="t(TEXT, 'studioOptions.aria')"
        class="mt-[env(safe-area-inset-top)] flex h-full w-[calc(env(safe-area-inset-left)+61px)] flex-col border-t border-r border-r-separator bg-surface pt-13.5 pb-[calc(var(--vertical-bottom-screen-inset)+env(safe-area-inset-top))] pl-[env(safe-area-inset-left)]"
        :class="hasTopEdgeLine ? 'border-t-separator' : 'border-t-transparent'"
        data-region="OptionPanel"
    >
        <!-- Separator -->
        <Separator />

        <!-- Studio options scroller -->
        <ScrollArea class="flex-1" :scroll-area-padding-right="0">
            <div class="flex flex-col gap-y-2 py-2">
                <!-- Options ─ Each option is inset 8px from both sides of the rail, with a small radius, as a compact list row is,
                     so its hover and selected fills never run into the panes beside it. The current option has the
                     selected tint, which is its own colour, as selected list rows, cards and table rows do. Hover is a
                     light grey. -->
                <div class="flex w-full px-2">
                    <ActionWrapper
                        :aria-current="selectedOptionId === 'home' ? 'page' : undefined"
                        :aria-label="t(TEXT, 'home.aria')"
                        class="flex w-full justify-center rounded p-2.25 dark:text-content [&_svg]:size-5.5"
                        :class="constructOptionStateClass('home')"
                        :to="{ name: 'studio', query: $route.query }"
                        @click="handleComplete"
                    >
                        <StudioHomeIcon aria-hidden="true" />
                    </ActionWrapper>
                </div>

                <div v-for="config in workflowOptionConfigs" :key="config.id" class="flex w-full px-2">
                    <ActionWrapper
                        :aria-current="selectedOptionId === config.id ? 'page' : undefined"
                        :aria-label="config.label"
                        class="flex w-full justify-center rounded p-2.25 dark:text-content [&_svg]:size-5.5"
                        :class="constructOptionStateClass(config.id)"
                        :to="{ name: config.id, query: $route.query }"
                        @click="handleComplete"
                    >
                        <ConfigIcon class="size-5.5" :icon="config.icon" :icon-dark="config.iconDark" />
                    </ActionWrapper>
                </div>
            </div>
        </ScrollArea>

        <Separator />
    </nav>
</template>
