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

// 'detail' names what was chosen in a step, such as the connection, and is shown under its label when the bar is wide.
const { activeId, items = [] } = defineProps<{ activeId?: string; items?: (LocalisedConfig<TaskConfig> & { detail?: string; disabled: boolean; to?: RouteLocationRaw })[] }>();

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
    <nav :aria-label="t(TEXT, 'steps.aria')" class="@container -mt-1.5 flex-none" data-region="TaskBar">
        <ScrollRow keep-active-item-in-view row-tag="ol">
            <li v-for="(item, index) in items" :key="item.id">
                <component
                    :is="item.disabled ? 'div' : ActionWrapper"
                    :aria-current="activeId === item.id ? 'step' : undefined"
                    class="group flex flex-col gap-y-1 pt-1 pb-2 text-sm"
                    :to="item.to"
                >
                    <!-- Filled circle for the current step, outlined for the others: accent when it can be opened, muted
                         when it is locked. The connector leads to the next step, so it takes that step's colour, and the
                         last step has none. -->
                    <div aria-hidden="true" class="flex h-5 items-center">
                        <div
                            class="flex size-5 flex-none items-center justify-center rounded-full border-2 text-xs font-semibold"
                            :class="[
                                activeId === item.id ? 'border-accent bg-accent text-surface' : 'bg-surface',
                                activeId !== item.id && (item.disabled ? 'border-muted text-muted' : 'border-accent text-accent')
                            ]"
                        >
                            <!-- 'text-box' trims the font's empty space above and below the digits, so they sit in the middle of the circle. -->
                            <span class="[text-box:trim-both_cap_alphabetic]">{{ item.number }}</span>
                        </div>
                        <div v-if="index < items.length - 1" class="mx-1 h-0.5 min-w-4 flex-1 rounded-full" :class="items[index + 1]?.disabled ? 'bg-muted/50' : 'bg-accent'" />
                    </div>

                    <!-- One line once the bar itself is wide enough, which is not the same as the viewport being wide: the
                         bar sits in an app pane the splitter resizes. Screen readers get the whole step from the hidden
                         text instead, so they hear the number and whether it is locked. -->
                    <span
                        aria-hidden="true"
                        class="leading-none"
                        :class="[index < items.length - 1 && 'pr-3', activeId === item.id ? 'text-accent' : item.disabled ? 'text-muted' : 'group-hover:text-accent']"
                    >
                        <span class="hidden flex-col gap-y-1 @min-[40rem]:flex">
                            <span>{{ item.label }}</span>
                            <span v-if="item.detail" class="max-w-48 truncate text-xs text-muted">{{ item.detail }}</span>
                        </span>
                        <span class="flex flex-col @min-[40rem]:hidden">
                            <span>{{ localiseLine(item.labelLine1) }}</span>
                            <span>{{ localiseLine(item.labelLine2) }}</span>
                        </span>
                    </span>
                    <span class="sr-only">{{ describeStep(item) }}</span>
                </component>
            </li>
        </ScrollRow>
    </nav>
</template>
