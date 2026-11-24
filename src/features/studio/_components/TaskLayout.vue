<script setup lang="ts">
// The frame of a studio screen that is worked through in tasks, such as Establish Data Views. The views of the saved
// items, such as a diagram and a list, and the tasks for one item share one row and one trail. Moving between a view
// and a task then changes only the content below them.

// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';

// ── Local Framework
import type { TaskBarItem } from '@/components/ui/taskBar';
import type { TaskTrailContent } from '@/components/ui/taskTrail';

// ── Static Components
import StudioHeader from './StudioHeader.vue';
import StudioLayout from './StudioLayout.vue';
import TabBar from '@/components/ui/TabBar.vue';
import TaskBar from '@/components/ui/TaskBar.vue';
import TaskTrail from '@/components/ui/TaskTrail.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface TaskLayoutView {
    id: string;
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
    to,
    trail,
    viewItems,
    viewsLabel
} = defineProps<{
    currentTaskId?: string;
    currentViewId?: string; // Undefined on a task, where no view is on screen.
    overline: string;
    tasksArePending?: boolean; // Keeps the space of the tasks and the trail, but hides them, while what they name loads.
    taskItems?: TaskBarItem[];
    title: string;
    titleIsPending?: boolean;
    to?: RouteLocationRaw;
    trail: TaskTrailContent; // Worked out from the route, never by the view or task on screen, so it does not change as they swap.
    viewItems: TaskLayoutView[];
    viewsLabel: string;
}>();

defineSlots<{ default(): unknown }>();
</script>

<template>
    <StudioLayout class="relative">
        <!-- Header -->
        <StudioHeader class="flex-none px-page" :overline="overline" :title="title" :title-is-pending="titleIsPending" :to="to" />

        <!-- Views and Tasks ─ One row, so a view is one click from any task and the way back is in plain sight. -->
        <div class="flex min-w-0 flex-none items-center">
            <TabBar class="flex-none" :active-id="currentViewId" :aria-label="viewsLabel" is-borderless :items="viewItems" />
            <template v-if="taskItems.length > 0">
                <span aria-hidden="true" class="-mt-1.5 h-5 w-px flex-none bg-separator" />
                <!-- The task bar sizes itself from its own width, so a box that grows gives it the rest of the row. The box
                     is pulled up as far as the views are, which pull themselves up into the header's empty space. -->
                <div class="-mt-1.5 min-w-0 flex-1">
                    <TaskBar :class="{ invisible: tasksArePending }" :current-id="currentTaskId" :items="taskItems" />
                </div>
            </template>
        </div>

        <!-- Trail ─ What the user is working on, in the same row on every view and task. -->
        <div class="flex h-10 min-w-0 flex-none items-center border-b border-separator px-page text-sm" :class="{ invisible: tasksArePending }">
            <TaskTrail class="min-w-0 flex-1" v-bind="trail" />
        </div>

        <slot />
    </StudioLayout>
</template>
