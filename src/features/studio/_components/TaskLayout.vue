<script setup lang="ts">
// The frame of a studio screen that is worked through in tasks, such as Establish Data Views. The views of the saved
// items, such as a diagram and a list, and the tasks for one item share one row and one trail. Moving between a view
// and a task then changes only the content below them.

// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';
import { type Component, computed } from 'vue';

// ── Local Framework
import type { TaskBarItem } from '@/components/ui/taskBar';
import type { TaskTrailContent } from '@/components/ui/taskTrail';

// ── Static Components
import IconButton from '@/components/ui/action/IconButton.vue';
import ScrollRow from '@/components/ui/scroll/ScrollRow.vue';
import StudioHeader from './StudioHeader.vue';
import StudioLayout from './StudioLayout.vue';
import TabBar from '@/components/ui/TabBar.vue';
import TaskBar from '@/components/ui/TaskBar.vue';
import TaskTrail from '@/components/ui/TaskTrail.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface TaskLayoutView {
    id: string;
    icon?: Component; // Views that all have an icon show as icon buttons, named by their labels, rather than as tabs.
    label: string;
    to: RouteLocationRaw;
}

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const {
    currentTaskId,
    currentViewId,
    overline,
    tasksArePending,
    taskItems = [],
    title,
    titleIsPending,
    trail,
    viewItems,
    viewsLabel
} = defineProps<{
    currentTaskId?: string;
    currentViewId?: string; // Undefined on a task, where no view is on screen.
    overline?: string; // Shown above the title on a task. Left out on a view, whose title already names the part of the app.
    tasksArePending?: boolean; // Keeps the space of the tasks and the trail, but hides them, while what they name loads.
    taskItems?: TaskBarItem[];
    title: string;
    titleIsPending?: boolean;
    trail: TaskTrailContent; // Worked out from the route, never by the view or task on screen, so it does not change as they swap.
    viewItems: TaskLayoutView[];
    viewsLabel: string;
}>();

defineSlots<{ default(): unknown }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const viewsAreIcons = computed(() => viewItems.length > 0 && viewItems.every((item) => item.icon != null));
</script>

<template>
    <StudioLayout class="relative">
        <!-- Header -->
        <StudioHeader class="flex-none px-page" :overline="overline" :title="title" :title-is-pending="titleIsPending" />

        <!-- Views and Tasks ─ One row, so a view is one click from any task and the way back is in plain sight. 34px
             high, the height of the view buttons, so nothing in the row overflows and scrolls. The trail below it has a
             row of the same height, so the heading area is two even rows on every view and task. Pulled up into the empty space
             under the header's title, so the heading takes little room. The views and tasks scroll together, as one
             control, so a narrow pane never keeps the views fixed while the tasks run out of room. 'ScrollRow' scrolls to
             each view and task, which are marked 'data-scroll-item', and '@container' gives the task labels the row's
             width to choose their length by. -->
        <div class="-mt-1.5 flex h-8.5 min-w-0 flex-none items-center">
            <ScrollRow
                arrow-align-class="items-center"
                class="@container min-w-0 flex-1 self-stretch"
                is-borderless
                item-selector="[data-scroll-item]"
                keep-active-item-in-view
                row-class="items-center"
            >
                <!-- Views ─ Icons lead the row as a switch between the views, and read as a different kind of thing from
                     the numbered tasks beside them. Neither is marked on a task, where no view is on screen. -->
                <nav v-if="viewsAreIcons" :aria-label="viewsLabel" class="flex flex-none items-center gap-x-1 pr-2" data-region="TaskLayoutViews">
                    <IconButton
                        v-for="item in viewItems"
                        :key="item.id"
                        :accessible-label="item.label"
                        :aria-current="item.id === currentViewId ? 'page' : undefined"
                        class="first:-ml-1.75"
                        data-scroll-item
                        :is-active="item.id === currentViewId"
                        size="sm"
                        :to="item.to"
                    >
                        <component :is="item.icon" :stroke-width="1.5" />
                    </IconButton>
                </nav>
                <TabBar v-else class="flex-none" :active-id="currentViewId" :aria-label="viewsLabel" is-borderless :items="viewItems" />
                <template v-if="taskItems.length > 0">
                    <!-- Divider ─ A step darker than the separator lines, so it stands out between the view icons and the steps. -->
                    <span aria-hidden="true" class="h-5 w-px flex-none bg-boundary-hover" />
                    <!-- The view icons sit 7px inside their buttons, so the gap before the divider looks wider than its 8px.
                         'pl-3' gives the steps 4px more, so the gaps either side of the divider look even. -->
                    <TaskBar class="pl-3" :class="{ invisible: tasksArePending }" :current-id="currentTaskId" :items="taskItems" />
                </template>
            </ScrollRow>
        </div>

        <!-- Trail ─ What the user is working on, in the same row on every view and task. The crumbs keep a 34px row, as
             the views and tasks do, and a 6px gap under it keeps them, and an icon crumb's hover fill, clear of the
             line below. -->
        <div class="flex min-w-0 flex-none border-b border-separator px-page pb-1.5 text-sm" :class="{ invisible: tasksArePending }">
            <div class="flex h-8.5 min-w-0 flex-1 items-center">
                <TaskTrail class="min-w-0 flex-1" v-bind="trail" />
            </div>
        </div>

        <slot />
    </StudioLayout>
</template>
