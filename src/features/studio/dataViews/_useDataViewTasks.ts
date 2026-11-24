// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { computed, type ComputedRef, type Ref, ref, watch } from 'vue';

// ── DPUse Framework
import { localiseConfigs } from '@dpuse/dpuse-shared';
import type { ConnectionConfig, ConnectorItemTypeId, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { isDataViewLoaded } from '@/features/studio/dataViews/_state/dataViewStore';
import { resolveCurrentDataViewStepId } from '@/features/studio/dataViews/_state/dataViewSummary';
import { localeId, t } from '@/state/locale';
import { TASK_CONFIGS, TEXT } from './_useDataViewTasks_.json';
import type { TaskBarItem, TaskConfig } from '@/components/ui/taskBar';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface DataViewTasksOptions {
    currentDataViewId: Readonly<Ref<string | undefined>>; // The data view open in a task. Undefined on the diagram and list.
    dataViewConfig: Readonly<Ref<DataViewConfig | undefined>>;
    dataViewConnectionLocalisedConfig: Readonly<Ref<LocalisedConfig<ConnectionConfig> | undefined>>;
    routeIsTask: Readonly<Ref<boolean>>;
}

interface DataViewTasks {
    completeTask: (taskLocalisedConfig: LocalisedConfig<TaskConfig>) => void;
    currentTaskLocalisedConfig: ComputedRef<TaskBarItem | undefined>;
    taskBarLocalisedItems: ComputedRef<TaskBarItem[]>;
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// The task bar of a data view: which tasks the user can open, what each is called, and what was chosen in each.
export function useDataViewTasks({ currentDataViewId, dataViewConfig, dataViewConnectionLocalisedConfig, routeIsTask }: DataViewTasksOptions): DataViewTasks {
    const route = useRoute();

    // Tasks the user has reached in this visit, which stay open when they go back to an earlier one.
    const unlockedUpToTaskNumber = ref(0);

    // The data view's saved progress unlocks every task up to the one it opens at. After a reload, or when the data view
    // is opened from the list, the task bar therefore shows every task it has already reached.
    const progressUnlockedUpToTaskNumber = computed(() => {
        if (dataViewConfig.value == null) return 0;
        const currentTaskId = resolveCurrentDataViewStepId(dataViewConfig.value);
        const unlockedTaskId = currentTaskId === 'connection' ? 'item' : currentTaskId; // A saved data view always has a connection, so its item can always be chosen.
        return TASK_CONFIGS.find((config) => config.id === unlockedTaskId)?.number ?? 0;
    });

    // A new connection or item has nothing to explore until it is previewed. From the diagram or list, Explore Data also
    // waits for the records, because it has nothing to show without them. A task leads to them through the item task,
    // where the load starts.
    const dataViewCanBeExplored = computed(() => dataViewConfig.value?.sampleConfig != null && (routeIsTask.value || isDataViewLoaded(dataViewConfig.value, false)));

    const itemTypeId = computed(() => dataViewConnectionLocalisedConfig.value?.connectorConfig.itemTypeId); // The connector's kind of item, which names the item task.

    // Each task's choice, which screen readers hear with the task.
    const taskDetails = computed((): Record<string, string | undefined> => {
        const itemConfig = dataViewConfig.value?.connectionNodeConfig;
        return {
            connection: dataViewConnectionLocalisedConfig.value?.label,
            item: itemConfig ? `${itemConfig.folderPath}/${itemConfig.label}` : undefined // The folder path and label, as the item step's trail shows them.
        };
    });

    const taskBarLocalisedItems = computed((): TaskBarItem[] =>
        localiseConfigs<TaskConfig>(TASK_CONFIGS, localeId.value).map((taskLocalisedConfig) => {
            const isDisabled =
                taskLocalisedConfig.number > Math.max(unlockedUpToTaskNumber.value, progressUnlockedUpToTaskNumber.value) ||
                (taskLocalisedConfig.id === 'data' && !dataViewCanBeExplored.value);
            return {
                ...taskLocalisedConfig,
                ...constructItemTaskLabels(taskLocalisedConfig.id, itemTypeId.value),
                detail: taskDetails.value[taskLocalisedConfig.id],
                disabled: isDisabled,
                to: isDisabled ? undefined : { name: taskLocalisedConfig.id, params: { dataViewId: route.params.dataViewId }, query: route.query } // On the diagram or list, the selected data view.
            };
        })
    );
    const currentTaskLocalisedConfig = computed(() => taskBarLocalisedItems.value.find((config) => config.id === route.name));

    // Opening a task, including straight from a link or after a page reload, unlocks the task bar up to that task. Tasks
    // that are already unlocked stay unlocked when the user goes back to an earlier one, but not into another data view,
    // which starts again from its own progress.
    watch(
        [(): unknown => route.name, currentDataViewId],
        ([newRouteName, newCurrentDataViewId], oldValues) => {
            const routeEnableUpTo = TASK_CONFIGS.find((config) => config.id === newRouteName)?.enableUpTo ?? 0;
            unlockedUpToTaskNumber.value = newCurrentDataViewId === oldValues[1] ? Math.max(unlockedUpToTaskNumber.value, routeEnableUpTo) : routeEnableUpTo;
        },
        { immediate: true }
    );

    // A finished task opens the tasks after it. It never locks a task reached already.
    function completeTask(taskLocalisedConfig: LocalisedConfig<TaskConfig>): void {
        unlockedUpToTaskNumber.value = Math.max(unlockedUpToTaskNumber.value, taskLocalisedConfig.enableUpTo);
    }

    return { completeTask, currentTaskLocalisedConfig, taskBarLocalisedItems };
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Whether a route is one of a data view's tasks, rather than the diagram or the list.
export function isDataViewTaskRoute(routeName: unknown): boolean {
    return TASK_CONFIGS.some((config) => config.id === routeName);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The item task is named for the connector's kind of item, e.g. 'Select File', once a connection that says which is
// chosen. Otherwise it keeps its own 'Select Item'.
function constructItemTaskLabels(taskId: string, itemTypeId: ConnectorItemTypeId | undefined): Partial<Pick<LocalisedConfig<TaskConfig>, 'label' | 'labelLine2'>> {
    return taskId === 'item' && itemTypeId != null ? { label: t(TEXT, `itemTask.${itemTypeId}.label`), labelLine2: TEXT[`itemTask.${itemTypeId}.short.label`] } : {};
}
