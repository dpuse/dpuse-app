<script setup lang="ts">
// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';

// ── DPUse Framework
import { DEFAULT_LOCALE_ID, type LocaleDescription, type LocaleLabel, type LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { localeId } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ScrollRow from '@/components/ui/scroll/ScrollRow.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The label is also given split over two lines for a narrow bar. Each language sets its own split, because word order
// differs between languages and the words cannot be joined or divided in code.
export interface TaskConfig {
    id: string;
    label: LocaleLabel;
    labelLine1: LocaleLabel;
    labelLine2: LocaleLabel;
    description: LocaleDescription;
    disabled: boolean;
    enableUpTo: number;
    number: number;
}

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { activeId, items = [] } = defineProps<{ activeId?: string; items?: (LocalisedConfig<TaskConfig> & { to?: RouteLocationRaw })[] }>();

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function localiseLine(line: LocaleLabel): string {
    return line[localeId.value] ?? line[DEFAULT_LOCALE_ID] ?? '';
}
</script>

<template>
    <!-- '-mt-1.5' pulls the bar up into the empty space at the bottom of the header above it. -->
    <ScrollRow class="@container -mt-1.5 flex-none" data-region="TaskBar" keep-active-item-in-view row-class="gap-x-1">
        <component
            :is="item.disabled ? 'div' : ActionWrapper"
            v-for="item in items"
            :key="item.id"
            :aria-selected="activeId === item.id"
            class="flex flex-col gap-y-1 pt-1 pb-2 text-sm"
            :class="item.disabled ? 'text-muted' : 'text-accent'"
            role="tab"
            :to="item.to"
        >
            <!-- Step line with the number on it. The line is drawn through the middle of the number, so the number is
                 never cut off by the top of the tab. -->
            <div class="relative flex h-4 items-center">
                <div class="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" :class="item.disabled ? 'bg-muted' : 'bg-accent'" />
                <div
                    class="relative flex size-4 items-center justify-center rounded-full text-[0.6875rem] font-bold text-surface"
                    :class="item.disabled ? 'bg-muted' : 'bg-accent'"
                >
                    <!-- 'text-box' trims the font's empty space above and below the digits, so they sit in the middle of the circle. -->
                    <span class="[text-box:trim-both_cap_alphabetic]">{{ item.number }}</span>
                </div>
            </div>

            <!-- One line once the bar itself is wide enough, which is not the same as the viewport being wide: the bar
                 sits in an app pane the splitter resizes. Only one version is displayed, so screen readers read one. -->
            <span class="hidden pr-2 leading-none @min-[40rem]:inline">{{ item.label }}</span>
            <span class="flex flex-col pr-2 leading-none @min-[40rem]:hidden">
                <span>{{ localiseLine(item.labelLine1) }}</span>
                <span>{{ localiseLine(item.labelLine2) }}</span>
            </span>
        </component>
    </ScrollRow>
</template>
