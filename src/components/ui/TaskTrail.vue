<script setup lang="ts">
// The row under a task screen's tabs and tasks that says what the user is working on, such as a data view's connection,
// folders and item. Each screen works its crumbs out from the route, so the row shows the same thing whichever view or
// task is on screen, and does not change as one replaces another.

// ── External Dependencies & Registrations
import { ArrowLeftIcon } from '@lucide/vue';
import { computed } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './TaskTrail_.json';
import type { TaskTrailContent, TaskTrailItem } from './taskTrail';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { back, items, label, tooltip } = defineProps<TaskTrailContent>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Screen readers skip a row that is only text, because the screen says the same things elsewhere, such as in the task
// bar.
const hasLinks = computed(() => back != null || items.some((item) => isLink(item)));
const lastItem = computed(() => items.at(-1));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function isLink(item: TaskTrailItem): boolean {
    return item.to != null || item.select != null;
}

// The last crumb is cut last, so its name stays in view after the ones before it shrink. It reads as text and turns
// blue only on hover, even as a link. An earlier crumb is blue as a link and muted as text.
function constructItemClasses(item: TaskTrailItem, isLast: boolean): string[] {
    const classes = [item.isLabelHidden === true ? 'flex flex-none items-center' : 'flex max-w-full min-w-0 items-center overflow-hidden'];
    if (isLast) classes.push('shrink-0');
    if (isLink(item)) {
        classes.push(
            'cursor-pointer transition-colors focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
            isLast ? 'text-content hover:text-accent' : 'text-accent hover:text-accent-hover'
        );
    } else if (!isLast) {
        classes.push('text-muted');
    }
    return classes;
}
</script>

<template>
    <nav :aria-hidden="hasLinks ? undefined : 'true'" :aria-label="label" class="flex h-full min-w-0 items-center overflow-hidden" data-region="TaskTrail" :title="tooltip">
        <!-- Back Button -->
        <template v-if="back && lastItem">
            <ActionWrapper
                :aria-label="t(TEXT, 'back.aria', { label: back.label })"
                class="flex h-10 min-w-0 shrink cursor-pointer items-center gap-x-2 text-accent transition-colors hover:text-accent-hover focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                @click="back.select()"
            >
                <ArrowLeftIcon aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
                <span class="min-w-0 truncate">{{ back.label }}</span>
            </ActionWrapper>
            <span aria-hidden="true" class="mx-1.5 flex-none text-subtle">/</span>
            <span class="min-w-0 flex-1 truncate text-muted">{{ lastItem.label }}</span>
        </template>

        <!-- Crumbs ─ An icon-only crumb is named by its tooltip, because the icon alone may not say what it is. -->
        <template v-for="(item, index) in items" v-else :key="item.id">
            <span v-if="index > 0" aria-hidden="true" class="mx-1.5 flex-none text-subtle">/</span>
            <component
                :is="isLink(item) ? ActionWrapper : 'span'"
                :aria-label="item.isLabelHidden ? item.label : undefined"
                :class="constructItemClasses(item, index === items.length - 1)"
                :title="item.isLabelHidden ? item.label : undefined"
                :to="item.to"
                @click="item.select?.()"
            >
                <ConfigIcon v-if="item.configIcon" class="size-5 flex-none" :icon="item.configIcon.icon" :icon-dark="item.configIcon.iconDark" />
                <component :is="item.icon" v-else-if="item.icon" aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
                <span v-if="!item.isLabelHidden" class="block min-w-0 truncate" :class="{ 'ml-2': item.configIcon || item.icon }">{{ item.label }}</span>
            </component>
        </template>
    </nav>
</template>
