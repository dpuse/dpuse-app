<script setup lang="ts">
// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';

// ── DPUse Framework
import type { LocaleDescription, LocaleLabel, LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ScrollRow from '@/components/ui/scroll/ScrollRow.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface TaskConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleDescription;
    disabled: boolean;
    enableUpTo: number;
    number: number;
    verb?: LocaleLabel;
}

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { activeId, items = [] } = defineProps<{ activeId?: string; items?: (LocalisedConfig<TaskConfig> & { to?: RouteLocationRaw })[] }>();
</script>

<template>
    <!-- '-mt-1.5' pulls the bar up into the empty space at the bottom of the header above it. -->
    <ScrollRow class="@container -mt-1.5 flex-none" data-region="TaskBar" row-class="gap-x-1">
        <component
            :is="item.disabled ? 'div' : ActionWrapper"
            v-for="item in items"
            :key="item.id"
            :aria-selected="activeId === item.id"
            class="flex flex-col gap-y-1 py-1 text-sm"
            :class="item.disabled ? 'text-muted' : 'text-accent'"
            role="tab"
            :to="item.to"
        >
            <!-- Step line with the number on it. The line is drawn through the middle of the number, so the number is
                 never cut off by the top of the tab. -->
            <div class="relative flex h-4 items-center">
                <div class="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" :class="item.disabled ? 'bg-muted' : 'bg-accent'" />
                <div
                    class="relative flex size-4 items-center justify-center rounded-full text-xs font-bold text-surface"
                    :class="item.disabled ? 'bg-muted' : 'bg-accent'"
                >
                    <!-- 'text-box' trims the font's empty space above and below the digits, so they sit in the middle of the circle. -->
                    <span class="[text-box:trim-both_cap_alphabetic]">{{ item.number }}</span>
                </div>
            </div>

            <!-- Verb and label share a line once the bar itself is wide enough, which is not the same question
                 as the viewport being wide: the bar sits in an app pane the splitter resizes. -->
            <div class="flex flex-col pr-2 leading-none @min-[40rem]:flex-row @min-[40rem]:gap-x-1">
                <span>{{ item.verb }}</span>
                <span>{{ item.label }}</span>
            </div>
        </component>
    </ScrollRow>
</template>
