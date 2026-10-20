<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';

// ── Local Framework
import { appearanceIsDark } from '@/state/appearance';
import { parseThemeTokens } from './_themeTokens';
import { t } from '@/state/locale';
import { TEXT } from './ThemePanel_.json';

// ── Static Components
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';

// ── Data
import themeCss from '@/assets/theme.css?raw';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Each mode is a column wrapped in its own class, so both show at once whatever the app's appearance.
const THEME_MODES = [
    { id: 'light', className: '', titleKey: 'light.title', valueKey: 'lightValue' },
    { id: 'dark', className: 'dark', titleKey: 'dark.title', valueKey: 'darkValue' }
] as const;

const THEME_TOKEN_GROUPS = parseThemeTokens(themeCss);

// State layers are drawn over each surface they appear on, because they are translucent and look different on each.
const STATE_LAYERS = [
    { id: 'hover', className: 'state-hover' },
    { id: 'press', className: 'state-press' },
    { id: 'selected', className: 'state-selected' },
    { id: 'selectedHover', className: 'state-selected-hover' }
] as const;
const STATE_SURFACES = [
    { id: 'backdrop', className: 'bg-backdrop' },
    { id: 'surface', className: 'bg-surface' },
    { id: 'card', className: 'bg-card' }
] as const;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
</script>

<template>
    <StudioLayout>
        <StudioHeader class="flex-none px-4" :overline="t(TEXT, 'studio.label')" :title="t(TEXT, 'theme.title')" :to="{ name: 'studio', query: route.query }" />

        <Separator />

        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <div class="flex flex-col gap-4 p-4">
                <!-- Light Column Notice ─ Light mode sets no class of its own, so the '.dark' palette on '<html>' also
                     reaches the light column and softens its stronger colours. -->
                <p v-if="appearanceIsDark" class="rounded-md bg-warning px-3 py-2 text-sm text-warning-text">{{ t(TEXT, 'lightColumn.text') }}</p>

                <div class="grid gap-4 md:grid-cols-2">
                    <section
                        v-for="mode in THEME_MODES"
                        :key="mode.id"
                        :aria-labelledby="`theme-${mode.id}`"
                        class="min-w-0 rounded-lg border border-boundary bg-surface p-4 text-content"
                        :class="mode.className"
                    >
                        <h2 :id="`theme-${mode.id}`" class="font-medium text-emphasis">{{ t(TEXT, mode.titleKey) }}</h2>

                        <!-- Colours -->
                        <h3 class="mt-4 text-sm font-medium text-emphasis">{{ t(TEXT, 'colours.title') }}</h3>
                        <div v-for="group in THEME_TOKEN_GROUPS" :key="group.id" class="mt-3">
                            <p v-if="group.note" class="text-xs text-muted">{{ group.note }}</p>
                            <ul class="mt-2 flex flex-col gap-2">
                                <li v-for="token in group.tokens" :key="token.id" class="flex items-start gap-3">
                                    <span class="size-8 flex-none rounded-md border border-boundary" :style="{ backgroundColor: `var(--${token.variableId})` }" />
                                    <span class="flex min-w-0 flex-col text-xs">
                                        <code class="font-mono text-emphasis">{{ token.id }}</code>
                                        <span class="wrap-anywhere text-muted">{{ token[mode.valueKey] }}</span>
                                        <span v-if="token.note" class="text-subtle">{{ token.note }}</span>
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <!-- States -->
                        <h3 class="mt-6 text-sm font-medium text-emphasis">{{ t(TEXT, 'states.title') }}</h3>
                        <div v-for="layer in STATE_LAYERS" :key="layer.id" class="mt-3">
                            <code class="font-mono text-xs text-emphasis">{{ layer.className }}</code>
                            <div class="mt-1 grid grid-cols-3 gap-2">
                                <div
                                    v-for="surface in STATE_SURFACES"
                                    :key="surface.id"
                                    class="flex h-10 items-center justify-center rounded-md border border-boundary font-mono text-xs"
                                    :class="[surface.className, layer.className]"
                                >
                                    {{ surface.className }}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </ScrollArea>
    </StudioLayout>
</template>
