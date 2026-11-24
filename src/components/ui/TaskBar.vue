<script setup lang="ts">
// ── External Dependencies & Registrations
import { CheckIcon } from '@lucide/vue';

// ── DPUse Framework
import { DEFAULT_LOCALE_ID, type LocaleLabel } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { TaskBarItem } from './taskBar';
import { TEXT } from './TaskBar_.json';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ScrollRow from '@/components/ui/scroll/ScrollRow.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { currentId, items = [] } = defineProps<{
    currentId?: string;
    items?: TaskBarItem[];
}>();

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function describeStep(item: TaskBarItem): string {
    const parameters = { detail: item.detail ?? '', label: item.label, number: item.number };
    if (item.disabled) return t(TEXT, 'step.locked.aria', parameters);
    return t(TEXT, item.detail == null ? 'step.aria' : 'step.chosen.aria', parameters);
}

function localiseLine(line: LocaleLabel): string {
    return line[localeId.value] ?? line[DEFAULT_LOCALE_ID] ?? '';
}
</script>

<template>
    <nav :aria-label="t(TEXT, 'steps.aria')" class="@container flex-none" data-region="TaskBar">
        <!-- The arrows sit level with the number and label line. -->
        <ScrollRow arrow-align-class="items-start" is-borderless keep-active-item-in-view row-tag="ol">
            <!-- 'relative' keeps each step's screen-reader text inside the scrolling row. Without it that text, which is
                 positioned absolutely, belongs to the row's outer wrapper instead, escapes the row's clipping, and iOS
                 Safari scrolls the whole page sideways to reach the steps past the right edge. -->
            <li v-for="(item, index) in items" :key="item.id" class="relative">
                <component
                    :is="item.disabled ? 'div' : ActionWrapper"
                    :aria-current="currentId === item.id ? 'step' : undefined"
                    :aria-disabled="item.disabled ? 'true' : undefined"
                    class="group flex items-start gap-x-1.5 text-sm"
                    :to="item.to"
                >
                    <!-- Marker beside the label rather than above it, which keeps the bar to two lines. Solid blue circle
                         for the current step. Outlined for the others: accent when it can be opened, faint when it is
                         locked. A step whose choice is made shows a tick instead of its number, as a done step. -->
                    <div
                        aria-hidden="true"
                        class="flex size-5 flex-none items-center justify-center rounded-full border-[1.25px] text-xs font-semibold"
                        :class="[
                            currentId === item.id ? 'border-accent bg-accent text-surface' : 'bg-surface',
                            currentId !== item.id && (item.disabled ? 'border-subtle text-subtle' : 'border-accent text-accent')
                        ]"
                    >
                        <!-- 'text-box' trims the font's empty space above and below the digits, so they sit in the middle of the circle. -->
                        <CheckIcon v-if="currentId !== item.id && !item.disabled && item.detail != null" class="size-3" :stroke-width="3" />
                        <span v-else class="[text-box:trim-both_cap_alphabetic]">{{ item.number }}</span>
                    </div>

                    <!-- The full label once the bar itself is wide enough, which is not the same as the viewport being
                         wide: the bar sits in an app pane the splitter resizes. Narrower, the verb is dropped and only the
                         noun stays. Screen readers get the whole step from the hidden text instead, so they hear the
                         number and whether it is locked. -->
                    <span aria-hidden="true" class="flex flex-col" :class="currentId === item.id ? 'text-accent' : item.disabled ? 'text-subtle' : 'group-hover:text-accent'">
                        <span class="flex items-center">
                            <span class="leading-5 whitespace-nowrap">
                                <span class="hidden @min-[40rem]:inline">{{ item.label }}</span>
                                <span class="@min-[40rem]:hidden">{{ localiseLine(item.labelLine2) }}</span>
                            </span>
                            <!-- The connector leads to the next step, so it takes that step's colour, and the last step has none. -->
                            <span
                                v-if="index < items.length - 1"
                                class="mx-0.5 h-[1.5px] w-8 flex-none rounded-full"
                                :class="items[index + 1]?.disabled ? 'bg-subtle' : 'bg-accent'"
                            />
                        </span>
                    </span>
                    <span class="sr-only">{{ describeStep(item) }}</span>
                </component>
            </li>
        </ScrollRow>
    </nav>
</template>
