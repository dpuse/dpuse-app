<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { localiseConfig, localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { navigationPendingDepth } from '@/router';
import { TEXT } from './DataViewsLayout_.json';
import { accountConfigsAreRetrieved, configRetrievalSucceeded } from '@/state/session';
import { activeConnectionConfig, activeDataViewConfig, connectionLocalisedConfigs } from '@/state/dataViews';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';
import TaskBar, { type TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TASK_CONFIGS: TaskConfig[] = [
    {
        id: 'connections',
        number: 1,
        label: TEXT['connections.label'],
        labelLine1: TEXT['connections.line1.label'],
        labelLine2: TEXT['connections.line2.label'],
        description: {},
        disabled: true,
        enableUpTo: 1
    },
    {
        id: 'items',
        number: 2,
        label: TEXT['items.label'],
        labelLine1: TEXT['items.line1.label'],
        labelLine2: TEXT['items.line2.label'],
        description: {},
        disabled: true,
        enableUpTo: 2
    },
    {
        id: 'content',
        number: 3,
        label: TEXT['content.label'],
        labelLine1: TEXT['content.line1.label'],
        labelLine2: TEXT['content.line2.label'],
        description: {},
        disabled: true,
        enableUpTo: 3
    },
    { id: 'data', number: 4, label: TEXT['data.label'], labelLine1: TEXT['data.line1.label'], labelLine2: TEXT['data.line2.label'], description: {}, disabled: true, enableUpTo: 4 }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const tasksEnabledUpToNumber = ref(0);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const taskLocalisedConfigs = computed(() => localiseConfigs<TaskConfig>(TASK_CONFIGS, localeId.value));
const taskLocalisedConfigsWithDisabled = computed((): LocalisedConfig<TaskConfig>[] =>
    taskLocalisedConfigs.value.map((taskLocalisedConfig) => ({
        ...taskLocalisedConfig,
        disabled: taskLocalisedConfig.number > tasksEnabledUpToNumber.value
    }))
);

// This layout hosts the 'RouterView' one level in, so it shows the spinner for its own panel. 'App.vue' covers the
// layout itself, which is what keeps the header and task bar in place through a panel swap.
const panelIsLoading = computed(() => navigationPendingDepth.value === 1);

// What was chosen in each step, shown under its label. The label is looked up again so it follows a change of language.
//
// TODO: Show the chosen item under the 'Select Item' step as well. It is left out because the chosen item lives only
// in 'SelectItemPanel' ('activeConnectionObjectConfig'), so nothing outside the panel can read it. To add it:
//   1. Keep it in shared state. 'activeDataViewConfig.connectionNodeConfig' is the intended home, and
//      'setConnectionNodeConfig' in '@/state/dataViews' already clears the later steps' configs with it, but nothing
//      calls it any more (see item 10 in 'useDataWindow.ts', which needs the same thing for the 'Details' tab).
//   2. Make that setter reactive. 'activeDataViewConfig' is a 'shallowRef' and the setters change the object in
//      place, so nothing watching it updates. Assign a new object instead ('{ ...value, connectionNodeConfig }'), as
//      'resetActiveDataViewConfig' in 'SelectConnectionList' already does, and do the same in the other setters.
//   3. Set it in 'SelectItemPanel.handleSelectConnectionNode' when a non-folder row is picked, and clear it on every
//      path that already calls 'updateItemIdQuery()' with no id: clearing the selection, opening a folder, and
//      choosing a breadcrumb. Set it on pick rather than on 'Continue', to match the connection, which shows as soon
//      as it is picked.
//   4. Make it survive a reload. Today the URL keeps only 'itemId', and the panel cannot get from an id back to its
//      folder (see the note above 'updateItemIdQuery'). Either put the item's path in the query (the one
//      'buildObjectPath' produces), so the panel can reopen its folder and the label can be read without a lookup,
//      or, once data views are saved, read 'connectionNodeConfig' from the stored record that 'getDataViewRecord'
//      returns. Until then the line under the step is simply absent after a reload, which is acceptable.
//   5. Add 'items: activeDataViewConfig.value?.connectionNodeConfig?.label' below. 'label' comes from the connector
//      and is not localised, so it needs no lookup. Fall back to 'name' if a connector leaves 'label' empty.
//   6. Changing the connection already clears the item: 'resetActiveDataViewConfig' sets 'connectionNodeConfig' to
//      undefined. Check that the line under 'Select Item' disappears when the connection changes.
const taskDetails = computed((): Record<string, string | undefined> => ({
    connections: connectionLocalisedConfigs.value.find((config) => config.id === activeConnectionConfig.value?.id)?.label
}));

const taskBarItems = computed(() =>
    taskLocalisedConfigsWithDisabled.value.map((config) => ({
        ...config,
        detail: taskDetails.value[config.id],
        to: config.disabled === true ? undefined : { name: config.id, query: route.query }
    }))
);

const activeTaskLocalisedConfig = computed(() => taskLocalisedConfigsWithDisabled.value.find((config) => config.id === route.name));
const navigateBackRouteName = computed(() => (route.name === 'dataViews' ? 'studio' : 'dataViews'));
const headerOverline = computed(() => t(TEXT, activeTaskLocalisedConfig.value ? 'establishDataViews.title' : 'studio.label'));
const headerTitle = computed(() => {
    if (!activeTaskLocalisedConfig.value) return t(TEXT, 'establishDataViews.title');
    return activeDataViewConfig.value ? localiseConfig(activeDataViewConfig.value, localeId.value).label : 'Loading...';
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(
    () => route.name,
    (newRouteName) => {
        const pendingEnableStepsUpTo = TASK_CONFIGS.find((config) => config.id === newRouteName)?.enableUpTo ?? 0;
        if (pendingEnableStepsUpTo > tasksEnabledUpToNumber.value) tasksEnabledUpToNumber.value = pendingEnableStepsUpTo;
    },
    { immediate: true }
);

// Single place (shared by all four tasks) that notices the active connection has genuinely gone away —
// reconnect races, sign-out, or the connector being removed all look the same from here. Gated on both
// configMonitor and accountMonitor having delivered data since connecting, so a momentary gap in either
// feed isn't mistaken for the connection actually disappearing. A no-op on connections since nothing
// is active there until the user picks something.
watch(connectionLocalisedConfigs, (newConnectionLocalisedConfigs) => {
    const active = activeConnectionConfig.value;
    if (active == null || !configRetrievalSucceeded.value || !accountConfigsAreRetrieved.value || newConnectionLocalisedConfigs.some((config) => config.id === active.id)) return;

    activeConnectionConfig.value = undefined;
    void router.replace({ name: 'dataViews' }).catch(() => {
        // Already reported by 'router.onError'.
    });
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleTaskCompleted(taskLocalisedConfig: LocalisedConfig<TaskConfig>): void {
    tasksEnabledUpToNumber.value = taskLocalisedConfig.enableUpTo;
}
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-4" :overline="headerOverline" :title="headerTitle" :to="{ name: navigateBackRouteName, query: route.query }" />

        <!-- Task Bar -->
        <TaskBar v-if="activeTaskLocalisedConfig" :active-id="activeTaskLocalisedConfig.id" :items="taskBarItems" />

        <!-- Data View List or Active Task Panel -->
        <RouterView v-slot="{ Component }">
            <ComponentLoadingSpinner v-if="panelIsLoading" class="min-h-0 flex-1" />
            <component :is="Component" v-else-if="route.name === 'dataViews'" class="min-h-0 flex-1" />
            <component :is="Component" v-else class="min-h-0 flex-1" :task-localised-config="activeTaskLocalisedConfig" @task-completed="handleTaskCompleted" />
        </RouterView>
    </StudioLayout>
</template>
