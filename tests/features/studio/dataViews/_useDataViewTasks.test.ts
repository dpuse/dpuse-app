// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { defineComponent, ref } from 'vue';
import { enableAutoUnmount, mount } from '@vue/test-utils';

// ── DPUse Framework
import type { ConnectionConfig, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { isDataViewLoaded } from '@/features/studio/dataViews/_state/dataViewStore';
import { settle } from '~/tests/support/settle';
import { TEXT } from '@/features/studio/dataViews/_useDataViewTasks_.json';
import { isDataViewTaskRoute, useDataViewTasks } from '@/features/studio/dataViews/_useDataViewTasks';

enableAutoUnmount(afterEach);

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// Explore Data opens from the diagram or list only once the records are loaded, which a test decides.
vi.mock('@/features/studio/dataViews/_state/dataViewStore', () => ({ isDataViewLoaded: vi.fn(() => false) }));

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type DataViewTasks = ReturnType<typeof useDataViewTasks>;

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const NEW_DATA_VIEW = buildDataView({});
const ITEM_CHOSEN_DATA_VIEW = buildDataView({ connectionNodeConfig: { folderPath: '/reports', label: 'sales.csv' } }); // No preview yet.
const PREVIEWED_DATA_VIEW = buildDataView({ connectionNodeConfig: { folderPath: '/reports', label: 'sales.csv' }, sampleConfig: {} });
const FILE_CONNECTION = { id: 'work', label: 'Work', connectorConfig: { itemTypeId: 'file' } } as unknown as LocalisedConfig<ConnectionConfig>;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// What the layout hands the composable, which each test sets as the layout would.
const currentDataViewId = ref<string>();
const dataViewConfig = ref<DataViewConfig>();
const dataViewConnectionLocalisedConfig = ref<LocalisedConfig<ConnectionConfig>>();
const routeIsTask = ref(false);

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('isDataViewTaskRoute', () => {
    it('names the three tasks, and neither the diagram nor the list', () => {
        expect(['connection', 'item', 'data'].map((name) => isDataViewTaskRoute(name))).toStrictEqual([true, true, true]);
        expect(['dataViewDiagram', 'dataViewList', undefined].map((name) => isDataViewTaskRoute(name))).toStrictEqual([false, false, false]);
    });
});

describe('useDataViewTasks', () => {
    beforeEach(() => {
        currentDataViewId.value = undefined;
        dataViewConfig.value = undefined;
        dataViewConnectionLocalisedConfig.value = undefined;
        routeIsTask.value = false;
        vi.mocked(isDataViewLoaded).mockReturnValue(false);
    });

    describe('unlocking', () => {
        it('opens only the connection task for a data view being added, until its connection is chosen', async () => {
            const { tasks } = await mountTasks('/dataViews/new/connections', {});

            expect(readEnabledTaskIds(tasks)).toStrictEqual(['connection']);
            expect(tasks.currentTaskLocalisedConfig.value?.id).toBe('connection');

            dataViewConfig.value = NEW_DATA_VIEW; // A data view always has its connection, so its item can be chosen.
            await settle();
            expect(readEnabledTaskIds(tasks)).toStrictEqual(['connection', 'item']);
        });

        it('opens every task a saved data view has reached, but Explore Data only once it is previewed', async () => {
            const chosen = await mountTasks('/dataViews/a/items', { dataView: ITEM_CHOSEN_DATA_VIEW });
            expect(readEnabledTaskIds(chosen.tasks)).toStrictEqual(['connection', 'item']);

            dataViewConfig.value = PREVIEWED_DATA_VIEW;
            await settle();
            expect(readEnabledTaskIds(chosen.tasks)).toStrictEqual(['connection', 'item', 'data']);
        });

        it('waits for the records before opening Explore Data from the diagram or list', async () => {
            const { tasks } = await mountTasks('/dataViews/list/a', { dataView: PREVIEWED_DATA_VIEW, isTask: false });
            expect(readEnabledTaskIds(tasks)).toStrictEqual(['connection', 'item']);

            vi.mocked(isDataViewLoaded).mockReturnValue(true);
            dataViewConfig.value = { ...PREVIEWED_DATA_VIEW }; // A new object, so the check runs again.
            await settle();
            expect(readEnabledTaskIds(tasks)).toStrictEqual(['connection', 'item', 'data']);
        });

        it('keeps a task open after going back to an earlier one, but not in another data view', async () => {
            const { router, tasks } = await mountTasks('/dataViews/new/items', {}); // Reached by a link, with no draft yet.
            expect(readEnabledTaskIds(tasks)).toStrictEqual(['connection', 'item']);

            await router.push('/dataViews/new/connections');
            await settle();
            expect(readEnabledTaskIds(tasks)).toStrictEqual(['connection', 'item']);

            currentDataViewId.value = 'b';
            await router.push('/dataViews/b/connections');
            await settle();
            expect(readEnabledTaskIds(tasks)).toStrictEqual(['connection']);
        });

        it('opens the tasks after one the user finishes, and never locks one already open', async () => {
            const { tasks } = await mountTasks('/dataViews/new/connections', {});
            tasks.completeTask(findTask(tasks, 'item'));
            await settle();
            expect(readEnabledTaskIds(tasks)).toStrictEqual(['connection', 'item']);

            tasks.completeTask(findTask(tasks, 'connection'));
            await settle();
            expect(readEnabledTaskIds(tasks)).toStrictEqual(['connection', 'item']);
        });
    });

    describe('labels and links', () => {
        it('names the item task for the connector’s kind of item once a connection is chosen', async () => {
            const { tasks } = await mountTasks('/dataViews/a/items', { dataView: ITEM_CHOSEN_DATA_VIEW });
            expect(findTask(tasks, 'item')).toMatchObject({ label: 'Select Item' });

            dataViewConnectionLocalisedConfig.value = FILE_CONNECTION;
            await settle();
            expect(findTask(tasks, 'item')).toMatchObject({ label: 'Select File', labelLine2: TEXT['itemTask.file.short.label'] });
        });

        it('gives each task the choice made in it, for screen readers', async () => {
            dataViewConnectionLocalisedConfig.value = FILE_CONNECTION;
            const { tasks } = await mountTasks('/dataViews/a/items', { dataView: ITEM_CHOSEN_DATA_VIEW });

            expect(tasks.taskBarLocalisedItems.value.map((task) => task.detail)).toStrictEqual(['Work', '/reports/sales.csv', undefined]);
        });

        it('links each open task to the same data view with the query kept, and leaves a closed one without a link', async () => {
            const { tasks } = await mountTasks('/dataViews/a/items?sView=items', { dataView: ITEM_CHOSEN_DATA_VIEW });

            expect(findTask(tasks, 'connection').to).toStrictEqual({ name: 'connection', params: { dataViewId: 'a' }, query: { sView: 'items' } });
            expect(findTask(tasks, 'data').to).toBeUndefined();
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Only the fields the task bar reads: an item once one is chosen, and a sample once it is previewed.
function buildDataView(progress: Record<string, unknown>): DataViewConfig {
    return { id: 'a', label: { en: 'Sales' }, description: {}, icon: null, iconDark: null, typeId: 'dataView', connectionId: 'work', ...progress } as DataViewConfig;
}

async function buildRouter(path: string): Promise<Router> {
    const component = { render: (): null => null };
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { name: 'dataViewList', path: '/dataViews/list/:dataViewId?', component },
            { name: 'connection', path: '/dataViews/:dataViewId/connections', component },
            { name: 'item', path: '/dataViews/:dataViewId/items', component },
            { name: 'data', path: '/dataViews/:dataViewId/data', component }
        ]
    });
    await router.push(path);
    await router.isReady();
    return router;
}

// The composable runs inside a component, as it does in the layout, so its watcher has a scope to live in.
async function mountTasks(path: string, { dataView, isTask = true }: { dataView?: DataViewConfig; isTask?: boolean }): Promise<{ router: Router; tasks: DataViewTasks }> {
    const router = await buildRouter(path);
    dataViewConfig.value = dataView;
    routeIsTask.value = isTask;
    currentDataViewId.value = isTask ? String(router.currentRoute.value.params.dataViewId) : undefined;
    let tasks: DataViewTasks | undefined;
    const Host = defineComponent({
        setup() {
            tasks = useDataViewTasks({ currentDataViewId, dataViewConfig, dataViewConnectionLocalisedConfig, routeIsTask });
            return renderNothing;
        }
    });
    mount(Host, { global: { plugins: [router] } });
    await settle();
    if (tasks == null) throw new Error('The composable did not run.');
    return { router, tasks };
}

function renderNothing(): null {
    return null;
}

function readEnabledTaskIds(tasks: DataViewTasks): string[] {
    return tasks.taskBarLocalisedItems.value.filter((task) => !task.disabled).map((task) => task.id);
}

function findTask(tasks: DataViewTasks, id: string): DataViewTasks['taskBarLocalisedItems']['value'][number] {
    const task = tasks.taskBarLocalisedItems.value.find((candidate) => candidate.id === id);
    if (!task) throw new Error(`No '${id}' task.`);
    return task;
}
