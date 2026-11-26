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

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { currentId, items = [] } = defineProps<{
    currentId?: string;
    items?: TaskBarItem[];
}>();

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A step's state, which its circle, label and the line after it show, as established step components such as Carbon's
// progress indicator do. Colour marks progress only: blue for the current step and done ones, grey for the rest. The
// labels stay neutral, because blue text means a link.
function constructStepStateId(item: TaskBarItem): 'available' | 'current' | 'done' | 'locked' {
    if (item.id === currentId) return 'current';
    if (item.disabled) return 'locked';
    return item.detail == null ? 'available' : 'done';
}

function constructMarkerClass(item: TaskBarItem): string {
    const classes = {
        available: 'border-muted bg-surface text-muted',
        current: 'border-accent bg-accent text-surface',
        done: 'border-accent bg-surface text-accent',
        locked: 'border-subtle bg-surface text-subtle'
    };
    return classes[constructStepStateId(item)];
}

// A step that can be opened underlines on hover, as every link does. The current step is already open.
function constructLabelClass(item: TaskBarItem): string {
    const classes = { available: 'text-content group-hover:underline', current: 'text-emphasis', done: 'text-content group-hover:underline', locked: 'text-subtle' };
    return classes[constructStepStateId(item)];
}

// The line turns blue once the step before it is done, so the row fills in from the left as progress does. Fainter
// before a locked step.
function constructConnectorClass(item: TaskBarItem, nextItem: TaskBarItem | undefined): string {
    if (constructStepStateId(item) === 'done') return 'bg-accent';
    return nextItem?.disabled === true ? 'bg-boundary-hover' : 'bg-subtle';
}

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
    <!-- Steps ─ No scrolling of their own. The host scrolls them, with anything beside them, as one row, so each step is
         marked 'data-scroll-item' for the host's 'ScrollRow' to scroll to. The label length follows the nearest
         '@container' around the bar, which the host sets on the scrolling row, because the bar's own width is its
         content's. -->
    <nav :aria-label="t(TEXT, 'steps.aria')" class="flex-none" data-region="TaskBar">
        <ol class="m-0 flex list-none items-center p-0">
            <!-- 'relative' keeps each step's screen-reader text inside the scrolling row. Without it that text, which is
                 positioned absolutely, belongs to an ancestor outside the row instead, escapes the row's clipping, and
                 iOS Safari scrolls the whole page sideways to reach the steps past the right edge. -->
            <li v-for="(item, index) in items" :key="item.id" class="relative" data-scroll-item>
                <component
                    :is="item.disabled ? 'div' : ActionWrapper"
                    :aria-current="currentId === item.id ? 'step' : undefined"
                    :aria-disabled="item.disabled ? 'true' : undefined"
                    class="group flex items-start gap-x-1.5 text-sm"
                    :to="item.to"
                >
                    <!-- Marker beside the label rather than above it, which keeps the bar to two lines. Solid blue for the
                         current step, a blue outline and a tick for a done one, a grey outline for one still to do, and a
                         faint one for a locked step. -->
                    <div
                        aria-hidden="true"
                        class="flex size-5 flex-none items-center justify-center rounded-full border-[1.25px] text-xs font-semibold"
                        :class="constructMarkerClass(item)"
                    >
                        <!-- 'text-box' trims the font's empty space above and below the digits, so they sit in the middle of the circle. -->
                        <CheckIcon v-if="constructStepStateId(item) === 'done'" class="size-3" :stroke-width="3" />
                        <span v-else class="[text-box:trim-both_cap_alphabetic]">{{ item.number }}</span>
                    </div>

                    <!-- The full label once the bar itself is wide enough, which is not the same as the viewport being
                         wide: the bar sits in an app pane the splitter resizes. Narrower, the verb is dropped and only the
                         noun stays. Screen readers get the whole step from the hidden text instead, so they hear the
                         number and whether it is locked. -->
                    <span aria-hidden="true" class="flex flex-col">
                        <span class="flex items-center">
                            <span class="leading-5 whitespace-nowrap decoration-current/40 underline-offset-2" :class="constructLabelClass(item)">
                                <span class="hidden @min-[40rem]:inline">{{ item.label }}</span>
                                <span class="@min-[40rem]:hidden">{{ localiseLine(item.labelLine2) }}</span>
                            </span>
                            <!-- The connector leads to the next step, and the last step has none. -->
                            <span v-if="index < items.length - 1" class="mx-0.5 h-[1.5px] w-8 flex-none rounded-full" :class="constructConnectorClass(item, items[index + 1])" />
                        </span>
                    </span>
                    <span class="sr-only">{{ describeStep(item) }}</span>
                </component>
            </li>
        </ol>
    </nav>
</template>
