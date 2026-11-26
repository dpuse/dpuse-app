<script setup lang="ts">
// The row under a task screen's tabs and tasks that says what the user is working on, such as a data view's connection,
// folders and item. Each screen works its crumbs out from the route, so the row shows the same thing whichever view or
// task is on screen, and does not change as one replaces another.

// ── External Dependencies & Registrations
import { ArrowLeftIcon } from '@lucide/vue';
import { useElementSize } from '@vueuse/core';
import { computed, useTemplateRef } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './TaskTrail_.json';
import type { TaskTrailContent, TaskTrailItem } from './taskTrail';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { back, emptyText, items, label, tooltip } = defineProps<TaskTrailContent>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Screen readers skip a row that is only text, because the screen says the same things elsewhere, such as in the task
// bar.
const hasLinks = computed(() => back != null || items.some((item) => isLink(item)));
const lastItem = computed(() => items.at(-1));

// ── Compact ─ A trail too narrow for every name shows crumbs that have a compact icon as that icon alone, rather than as
// clipped names that cannot be read. A hidden copy of the trail with every name in full measures the width it needs.
const navElement = useTemplateRef<HTMLElement>('nav');
const measureElement = useTemplateRef<HTMLElement>('measure');
const { width: navWidth } = useElementSize(navElement);
const { width: fullWidth } = useElementSize(measureElement);
const hasCompactIcons = computed(() => back == null && items.some((item) => item.compactIcon != null));
const trailIsCompact = computed(() => hasCompactIcons.value && fullWidth.value > navWidth.value);

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function isLink(item: TaskTrailItem): boolean {
    return item.to != null || item.select != null;
}

function isLabelHidden(item: TaskTrailItem): boolean {
    return item.isLabelHidden === true || (trailIsCompact.value && item.compactIcon != null);
}

// The last crumb is cut last, so its name stays in view after the ones before it shrink. It names the current item, so
// it stays in the text colour even as a link, and only an underline on hover shows it can be clicked. An earlier crumb
// is blue as a link and muted as text. Every link with a name underlines on hover, as the header's back link does,
// because a slightly darker blue is too small a change to notice. A link shown as its icon alone has no text to
// underline, so it takes the grey hover fill of an icon button instead, with the same padding and radius as a small
// 'IconButton'. A matching negative margin cancels the padding, so the fill has room without moving the crumbs. The
// trail clips its overflow, so long names can be cut short, and is widened by the same 7px on each side with padding
// and a negative margin, so an icon-only crumb at either end keeps its whole fill.
function constructItemClasses(item: TaskTrailItem, isLast: boolean): string[] {
    const classes = [isLabelHidden(item) ? 'flex flex-none items-center' : 'flex max-w-full min-w-0 items-center overflow-hidden'];
    if (isLast) classes.push('shrink-0');
    if (isLink(item)) {
        classes.push(
            'cursor-pointer transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
            isLabelHidden(item)
                ? '-m-1.75 rounded-lg p-1.75 hover:state-hover active:state-press'
                : isLast
                  ? 'text-content hover:underline hover:decoration-content/40 hover:underline-offset-2'
                  : 'text-accent hover:text-accent-hover hover:underline hover:decoration-accent-hover/40 hover:underline-offset-2'
        );
    } else if (!isLast) {
        classes.push('text-muted');
    }
    return classes;
}
</script>

<template>
    <nav
        ref="nav"
        :aria-hidden="hasLinks ? undefined : 'true'"
        :aria-label="label"
        class="relative -mx-1.75 flex h-full min-w-0 items-center overflow-hidden px-1.75"
        data-region="TaskTrail"
        :title="tooltip"
    >
        <!-- Back Button -->
        <template v-if="back && lastItem">
            <ActionWrapper
                :aria-label="t(TEXT, 'back.aria', { label: back.label })"
                class="flex h-10 min-w-0 shrink cursor-pointer items-center gap-x-2 text-muted transition-colors hover:text-content hover:underline hover:decoration-content/40 hover:underline-offset-2 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                @click="back.select()"
            >
                <ArrowLeftIcon aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
                <span class="min-w-0 truncate">{{ back.label }}</span>
            </ActionWrapper>
            <span aria-hidden="true" class="mx-1.5 flex-none text-subtle">/</span>
            <span class="min-w-0 flex-1 truncate text-muted">{{ lastItem.label }}</span>
        </template>

        <!-- Empty Text -->
        <span v-else-if="items.length === 0 && emptyText" class="min-w-0 truncate text-hint italic">{{ emptyText }}</span>

        <!-- Crumbs ─ An icon-only crumb is named by its tooltip, because the icon alone may not say what it is. -->
        <template v-for="(item, index) in items" v-else :key="item.id">
            <span v-if="index > 0" aria-hidden="true" class="mx-1.5 flex-none text-subtle">/</span>
            <component
                :is="isLink(item) ? ActionWrapper : 'span'"
                :aria-label="isLabelHidden(item) ? item.label : undefined"
                :class="constructItemClasses(item, index === items.length - 1)"
                :title="isLabelHidden(item) ? item.label : undefined"
                :to="item.to"
                @click="item.select?.()"
            >
                <ConfigIcon v-if="item.configIcon" class="size-5 flex-none" :icon="item.configIcon.icon" :icon-dark="item.configIcon.iconDark" />
                <component :is="item.icon" v-else-if="item.icon" aria-hidden="true" class="size-5 flex-none" :class="item.iconClass" :stroke-width="item.iconStrokeWidth ?? 1.5" />
                <component :is="item.compactIcon" v-else-if="trailIsCompact && item.compactIcon" aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
                <span v-if="!isLabelHidden(item)" class="block min-w-0 truncate" :class="{ 'ml-1': item.configIcon || item.icon }">{{ item.label }}</span>
            </component>
        </template>

        <!-- Measure ─ The crumbs with every name in full, invisible and out of the layout. 'w-max' stops the row
             shrinking to the trail's width, which is the width it is measured against. -->
        <div v-if="hasCompactIcons" ref="measure" aria-hidden="true" class="pointer-events-none invisible absolute flex w-max items-center whitespace-nowrap">
            <template v-for="(item, index) in items" :key="item.id">
                <span v-if="index > 0" class="mx-1.5">/</span>
                <span v-if="item.configIcon || item.icon" class="size-5" />
                <span v-if="!item.isLabelHidden" :class="{ 'ml-1': item.configIcon || item.icon }">{{ item.label }}</span>
            </template>
        </div>
    </nav>
</template>
