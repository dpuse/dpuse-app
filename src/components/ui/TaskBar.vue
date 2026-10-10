<script setup lang="ts">
// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';

// ── DPUse Framework
import { DEFAULT_LOCALE_ID, type LocaleDescription, type LocaleLabel, type LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT } from './TaskBar_.json';
import { localeId, t } from '@/state/locale';

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
    enableUpTo: number;
    number: number;
}

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// 'detail' names what was chosen in a step, such as the connection. It is read out with the step; the host shows it on
// screen wherever there is room for it.
const { activeId, items = [] } = defineProps<{
    activeId?: string;
    items?: (LocalisedConfig<TaskConfig> & { detail?: string; disabled: boolean; to?: RouteLocationRaw })[];
}>();

defineSlots<{
    default?(): unknown; // Rendered below the steps, above the bar's bottom line, e.g. a summary of what has been chosen.
}>();

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function describeStep(item: LocalisedConfig<TaskConfig> & { detail?: string; disabled: boolean }): string {
    const parameters = { detail: item.detail ?? '', label: item.label, number: item.number };
    if (item.disabled) return t(TEXT, 'step.locked.aria', parameters);
    return t(TEXT, item.detail == null ? 'step.aria' : 'step.chosen.aria', parameters);
}

function localiseLine(line: LocaleLabel): string {
    return line[localeId.value] ?? line[DEFAULT_LOCALE_ID] ?? '';
}
</script>

<template>
    <!-- '-mt-1.5' pulls the bar up into the empty space at the bottom of the header above it. -->
    <nav :aria-label="t(TEXT, 'steps.aria')" class="@container -mt-1.5 flex-none border-b border-separator" data-region="TaskBar">
        <!-- The arrows sit level with the number and label line. -->
        <ScrollRow arrow-align-class="items-start pt-1" is-borderless keep-active-item-in-view row-tag="ol">
            <!-- 'relative' keeps each step's screen-reader text inside the scrolling row. Without it that text, which is
                 positioned absolutely, belongs to the row's outer wrapper instead, escapes the row's clipping, and iOS
                 Safari scrolls the whole page sideways to reach the steps past the right edge. -->
            <li v-for="(item, index) in items" :key="item.id" class="relative">
                <component
                    :is="item.disabled ? 'div' : ActionWrapper"
                    :aria-current="activeId === item.id ? 'step' : undefined"
                    class="group flex items-start gap-x-1.5 pt-1 pb-2 text-sm"
                    :to="item.to"
                >
                    <!-- Marker beside the label rather than above it, which keeps the bar to two lines. Filled circle for
                         the current step, outlined for the others: accent when it can be opened, muted when it is locked. -->
                    <div
                        aria-hidden="true"
                        class="flex size-5 flex-none items-center justify-center rounded-full border-[1.25px] text-xs font-semibold"
                        :class="[
                            activeId === item.id ? 'border-accent bg-accent text-surface' : 'bg-surface',
                            activeId !== item.id && (item.disabled ? 'border-muted text-muted' : 'border-accent text-accent')
                        ]"
                    >
                        <!-- 'text-box' trims the font's empty space above and below the digits, so they sit in the middle of the circle. -->
                        <span class="[text-box:trim-both_cap_alphabetic]">{{ item.number }}</span>
                    </div>

                    <!-- The full label once the bar itself is wide enough, which is not the same as the viewport being
                         wide: the bar sits in an app pane the splitter resizes. Narrower, the verb is dropped and only the
                         noun stays. Screen readers get the whole step from the hidden text instead, so they hear the
                         number and whether it is locked. -->
                    <span aria-hidden="true" class="flex flex-col" :class="activeId === item.id ? 'text-accent' : item.disabled ? 'text-muted' : 'group-hover:text-accent'">
                        <span class="flex items-center">
                            <span class="leading-5 whitespace-nowrap">
                                <span class="hidden @min-[40rem]:inline">{{ item.label }}</span>
                                <span class="@min-[40rem]:hidden">{{ localiseLine(item.labelLine2) }}</span>
                            </span>
                            <!-- The connector leads to the next step, so it takes that step's colour, and the last step has none. -->
                            <span
                                v-if="index < items.length - 1"
                                class="mx-0.5 h-[1.5px] w-8 flex-none rounded-full"
                                :class="items[index + 1]?.disabled ? 'bg-muted/50' : 'bg-accent'"
                            />
                        </span>
                    </span>
                    <span class="sr-only">{{ describeStep(item) }}</span>
                </component>
            </li>
        </ScrollRow>

        <slot />
    </nav>
</template>
