<script setup lang="ts">
// ── External Dependencies & Registrations
import { FileIcon } from '@lucide/vue';
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, localiseConfig, localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { accountConfigsAreRetrieved, activeMetaStoreConnectionConfig, configRetrievalSucceeded } from '@/state/session';
import { activeConnectionConfig, activeDataViewConfig, connectionLocalisedConfigs, getDataViewRecord } from '@/state/dataViews';
import { type AppFailure, raiseFailure } from '@/state/errors';
import { constructItemPath, resolveCurrentDataViewStepId } from './dataViewSummary';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';
import { localeId, t } from '@/state/locale';
import { TASK_CONFIGS, TEXT } from './DataViewsLayout_.json';

// ── Static Components
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import RouterViewTransition from '@/components/ui/RouterViewTransition.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';
import TaskBar, { type TaskConfig } from '@/components/ui/TaskBar.vue';

// ── State - Route ────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── State - Task Bar ─────────────────────────────────────────────────────────────────────────────────────────────────

const unlockedUpToTaskNumber = ref(0);

// ── State - List and Task Panel ──────────────────────────────────────────────────────────────────────────────────────

const dataViewFailure = shallowRef<AppFailure | undefined>(); // Shown in place of the task, which has nothing to work on without its data view.

// ── Derived State - Task Localised Configuration ─────────────────────────────────────────────────────────────────────

// The data view's saved progress unlocks every step up to the first one not done yet, so a reload or a data view opened
// from the list shows the steps it has already reached.
const progressUnlockedUpToTaskNumber = computed(() => {
    if (activeDataViewConfig.value == null) return 0;
    const currentStepId = resolveCurrentDataViewStepId(activeDataViewConfig.value);
    return TASK_CONFIGS.find((config) => config.id === currentStepId)?.number ?? 0;
});
const taskLocalisedConfigs = computed((): (LocalisedConfig<TaskConfig> & { disabled: boolean })[] =>
    localiseConfigs<TaskConfig>(TASK_CONFIGS, localeId.value).map((taskLocalisedConfig) => ({
        ...taskLocalisedConfig,
        disabled: taskLocalisedConfig.number > Math.max(unlockedUpToTaskNumber.value, progressUnlockedUpToTaskNumber.value)
    }))
);
const activeTaskLocalisedConfig = computed(() => taskLocalisedConfigs.value.find((config) => config.id === route.name));

// ── Derived State - Header ───────────────────────────────────────────────────────────────────────────────────────────

const headerOverline = computed(() => t(TEXT, activeTaskLocalisedConfig.value ? 'establishDataViews.title' : 'studio.label'));
const headerTitle = computed(() => {
    if (!activeTaskLocalisedConfig.value) return t(TEXT, 'establishDataViews.title');
    return activeDataViewConfig.value ? localiseConfig(activeDataViewConfig.value, localeId.value).label : t(TEXT, 'dataView.pending.title');
});
const headerBackRouteName = computed(() => (route.name === 'dataViews' ? 'studio' : 'dataViews'));

// ── Derived State - Task Bar ─────────────────────────────────────────────────────────────────────────────────────────

// What was chosen in each step: read out with its step, and shown together in the summary line below the bar. The
// connection's label is looked up again so it follows a change of language.
const taskStepChoices = computed((): Record<string, string | undefined> => {
    const itemConfig = activeDataViewConfig.value?.connectionNodeConfig;
    return {
        connection: activeConnectionConfig.value?.label,
        item: itemConfig ? constructItemPath(itemConfig) : undefined
    };
});
const taskBarLocalisedItems = computed(() =>
    taskLocalisedConfigs.value.map((config) => ({
        ...config,
        detail: taskStepChoices.value[config.id],
        to: config.disabled ? undefined : { name: config.id, query: route.query }
    }))
);

// ── Derived State - Summary ──────────────────────────────────────────────────────────────────────────────────────────

const summaryItemConfig = computed(() => activeDataViewConfig.value?.connectionNodeConfig);
const summaryItemIconIsPresent = computed(() => [summaryItemConfig.value?.icon, summaryItemConfig.value?.iconDark].some((svg) => svg != null && svg !== ''));

// Split before the file name, so a long path is cut in the middle: the start of its folder path and the whole file name
// stay in view.
const summaryItemPathParts = computed(() => {
    const itemPath = taskStepChoices.value.item;
    if (itemPath == null) return;
    const nameStart = itemPath.lastIndexOf('/') + 1;
    return { folderPath: itemPath.slice(0, nameStart), name: itemPath.slice(nameStart) };
});

// ── Derived State - List and Task Panel ──────────────────────────────────────────────────────────────────────────────

// This layout hosts the 'RouterView' one level in, so it shows the spinner for its own panel. 'App.vue' covers the
// layout itself, which is what keeps the header and task bar in place through a panel swap.
const taskPanelIsLoading = computed(() => navigationPendingDepth.value === 1);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Opening a task, including straight from a link or after a page reload, unlocks the task bar up to that task. Tasks that
// are already unlocked stay unlocked when the user goes back to an earlier one, but not into another data view, which
// starts again from its own progress.
watch(
    [(): unknown => route.name, (): string | undefined => activeDataViewConfig.value?.id],
    ([newRouteName, newDataViewId], oldValues) => {
        const routeEnableUpTo = TASK_CONFIGS.find((config) => config.id === newRouteName)?.enableUpTo ?? 0;
        unlockedUpToTaskNumber.value = newDataViewId === oldValues[1] ? Math.max(unlockedUpToTaskNumber.value, routeEnableUpTo) : routeEnableUpTo;
    },
    { immediate: true }
);

// Loads the data view in the URL whenever a task is open and the one in memory is not it, as after a reload, a deep link
// or Back/Forward. Held here rather than in each task, so every task, and the header and task bar above them, have it
// whichever task the page opens on.
watch([activeMetaStoreConnectionConfig, (): unknown => route.params.dataViewId, (): unknown => route.name], () => void loadDataView(), { immediate: true });

// If the data view's connection disappears from the list (the user signed out, or its connector was removed), go back
// to the data view list, whose panel says the connection has gone. Only from a task, since the list is where it goes.
// Checked on mount too, because it may have gone while the user was elsewhere.
watch(
    [connectionLocalisedConfigs, (): string | undefined => activeDataViewConfig.value?.connectionId],
    ([newConnectionLocalisedConfigs, newConnectionId]) => {
        if (!configRetrievalSucceeded.value || !accountConfigsAreRetrieved.value) return; // Still loading, so a short list proves nothing.
        if (newConnectionId == null || activeTaskLocalisedConfig.value == null || newConnectionLocalisedConfigs.some((config) => config.id === newConnectionId)) return;

        void ignoreReportedNavigationFailure(router.replace({ name: 'dataViews', query: route.query }));
    },
    { immediate: true }
);

// TODO: TEMPORARY iOS sideways-scroll diagnostic — remove once the cause is found.
if (import.meta.env.DEV) {
    setTimeout(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const sticking = [...document.querySelectorAll<HTMLElement>('body *')]
            .filter((element) => element.getBoundingClientRect().right > viewportWidth + 1)
            .slice(0, 8)
            .map(
                (element) =>
                    `${element.dataset.region ?? element.tagName} right=${String(Math.round(element.getBoundingClientRect().right))} .${String(element.getAttribute('class')).slice(0, 60)}`
            );
        alert(
            `width ${String(viewportWidth)} scrollWidth ${String(document.documentElement.scrollWidth)} zoom ${String(visualViewport?.scale)}\n` +
                (sticking.join('\n') || 'nothing sticks out')
        );
    }, 3000);
}

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetryDataView(): void {
    void loadDataView();
}

function handleTaskCompleted(taskLocalisedConfig: LocalisedConfig<TaskConfig>): void {
    unlockedUpToTaskNumber.value = Math.max(unlockedUpToTaskNumber.value, taskLocalisedConfig.enableUpTo); // Never locks a step reached already.
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A data view with no connection yet can only be worked on from the connection task, so any later task sends it there.
async function loadDataView(): Promise<void> {
    const metaStoreConnectionConfig = activeMetaStoreConnectionConfig.value;
    if (metaStoreConnectionConfig == null || activeTaskLocalisedConfig.value == null || activeDataViewConfig.value?.id === String(route.params.dataViewId)) return;

    dataViewFailure.value = undefined;
    try {
        const dataViewConfig = await getDataViewRecord(metaStoreConnectionConfig, route);
        if (dataViewConfig.connectionId == null && route.name !== 'connection') void ignoreReportedNavigationFailure(router.replace({ name: 'connection', query: route.query }));
    } catch (error) {
        dataViewFailure.value = raiseFailure(new AppError('Failed to open this data view.', 'dpuse-app.DataViewsLayout.loadDataView', { typeId: 'handled' }, { cause: error }));
    }
}
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-4" :overline="headerOverline" :title="headerTitle" :to="{ name: headerBackRouteName, query: route.query }" />

        <!-- Task Bar -->
        <TaskBar v-if="activeTaskLocalisedConfig" :active-id="activeTaskLocalisedConfig.id" :items="taskBarLocalisedItems">
            <!-- Summary - What the data view is built from so far, across the full width, each part with the icon it has
                 in its own list. Always there, empty until something is chosen, so choosing does not push the panel below
                 down. Hidden from screen readers, which hear each choice with its step. The connection is never cut short;
                 a long path is cut in its folder path, so its file name stays in view. -->
            <p aria-hidden="true" class="m-0 flex h-7 min-w-0 items-center gap-x-4 overflow-hidden px-4 pb-2 text-sm whitespace-nowrap text-muted">
                <span v-if="activeConnectionConfig" class="flex max-w-1/2 flex-none items-center gap-x-1.5">
                    <ConfigIcon class="size-4" :icon="activeConnectionConfig.icon" :icon-dark="activeConnectionConfig.iconDark" />
                    <span class="truncate">{{ activeConnectionConfig.label }}</span>
                </span>
                <span v-if="summaryItemConfig && summaryItemPathParts" class="flex min-w-0 items-center gap-x-1.5">
                    <ConfigIcon v-if="summaryItemIconIsPresent" class="size-4" :icon="summaryItemConfig.icon" :icon-dark="summaryItemConfig.iconDark" />
                    <FileIcon v-else class="size-4 flex-none" :stroke-width="1.5" />
                    <span class="flex min-w-0">
                        <span class="min-w-0 shrink-100 truncate">{{ summaryItemPathParts.folderPath }}</span>
                        <span class="min-w-0 truncate">{{ summaryItemPathParts.name }}</span>
                    </span>
                </span>
            </p>
        </TaskBar>

        <!-- Data View Failure -->
        <ErrorNotice v-if="dataViewFailure" class="min-h-0 flex-1" covers-region :failures="[dataViewFailure]" @retry="handleRetryDataView" />

        <!-- List and Task Panel -->
        <RouterViewTransition v-else v-slot="{ component }" class="min-h-0 flex-1" :is-loading="taskPanelIsLoading">
            <component :is="component" v-if="route.name === 'dataViews'" key="dataViews" class="min-h-0 flex-1" />
            <component :is="component" v-else :key="route.name" class="min-h-0 flex-1" :task-localised-config="activeTaskLocalisedConfig" @task-completed="handleTaskCompleted" />
        </RouterViewTransition>
    </StudioLayout>
</template>
