// ── External Dependencies & Registrations
import { type Component, shallowRef } from 'vue';
import { createRouter, createWebHistory, isNavigationFailure, type LocationQueryRaw, NavigationFailureType, type Router, type RouteRecordRaw } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { raiseAppFailure } from '@/state/errors';
import { addDevelopmentFaults, type AsyncPanelSimulation, VISIBLE_DELAY_MS } from '@/utilities/index.ts';
import { canReloadForNewAppVersion, reloadForNewAppVersion } from '@/state/appVersion';

// ── Static Components
import StudioHomePanel from '@/features/studio/StudioHomePanel.vue'; // Static, so it downloads with the entry chunk. vue-router fetches the first screen on every start, even when only the assistant shows.

// ── Dynamic Components
// Every loader is wrapped so that a failed chunk can be reported by name, and so that loading one raises the spinner.
// The number is the nesting level of the 'RouterView' that renders the component. The one in 'App.vue' is 0, and the
// one inside a layout such as 'DataViewsLayout' is 1. 'assertViewDepths' checks these against the route table at
// startup in Dev environment.
const DataViewsLayout = defineLazyLoader('DataViewsLayout', 0, () => import('@/features/studio/dataViews/DataViewsLayout.vue'));
const DataViewList = defineLazyLoader('DataViewList', 1, () => import('@/features/studio/dataViews/DataViewList.vue'));
const SelectConnectionList = defineLazyLoader('SelectConnectionList', 1, () => import('@/features/studio/dataViews/selectConnection/SelectConnectionList.vue'));
const SelectItemPanel = defineLazyLoader('SelectItemPanel', 1, () => import('@/features/studio/dataViews/selectItem/SelectItemPanel.vue'));
const AuditContentPanel = defineLazyLoader('AuditContentPanel', 1, () => import('@/features/studio/dataViews/auditContent/AuditContentPanel.vue'));
const ExploreDataPanel = defineLazyLoader('ExploreDataPanel', 1, () => import('@/features/studio/dataViews/exploreData/ExploreDataPanel.vue'));
const EventQueriesPanel = defineLazyLoader('EventQueriesPanel', 0, () => import('@/features/studio/eventQueries/EventQueriesPanel.vue'));
const PresentationsPanel = defineLazyLoader('PresentationsPanel', 0, () => import('@/features/studio/presentations/PresentationsPanel.vue'));
const DataAppsPanel = defineLazyLoader('DataAppsPanel', 0, () => import('@/features/studio/dataApps/DataAppsPanel.vue'));
const SetupLayout = defineLazyLoader('SetupLayout', 0, () => import('@/features/studio/setup/SetupLayout.vue'));
const SetupHomePanel = defineLazyLoader('SetupHomePanel', 1, () => import('@/features/studio/setup/SetupHomePanel.vue'));
const ContextModelList = defineLazyLoader('ContextModelList', 1, () => import('@/features/studio/setup/context/ContextModelList.vue'));
const PluginList = defineLazyLoader('PluginList', 1, () => import('@/features/studio/setup/plugins/PluginList.vue'));

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// A lazy route component is just a loader function, so the label and depth ride on it as properties. They are there
// for 'assertViewDepths', which reads them straight off the route table.
interface RouteComponentLoader {
    (): Promise<Component>;
    label: string;
    viewDepth: number;
}

// Query changes waiting to be written to one router's URL.
interface QueryUpdate {
    changes: LocationQueryRaw;
    flush: Promise<void> | undefined; // The write that will include changes made now. Cleared once that write starts.
    settled: Promise<void>; // The latest write. The next one waits for it, so it reads the URL that write produced.
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const APP_ROUTES = [
    {
        path: '/',
        children: [
            { name: 'studio', path: '', component: StudioHomePanel },
            {
                path: 'dataViews',
                component: DataViewsLayout,
                children: [
                    { name: 'dataViews', path: ':dataViewId?', component: DataViewList },
                    {
                        path: ':dataViewId',
                        children: [
                            { name: 'connection', path: 'connections', component: SelectConnectionList },
                            { name: 'item', path: 'items', component: SelectItemPanel },
                            { name: 'content', path: 'content', component: AuditContentPanel },
                            { name: 'data', path: 'data', component: ExploreDataPanel }
                        ]
                    }
                ]
            },
            { name: 'eventQueries', path: 'eventQueries', component: EventQueriesPanel },
            { name: 'presentations', path: 'presentations', component: PresentationsPanel },
            { name: 'dataApps', path: 'dataApps', component: DataAppsPanel },
            {
                path: 'setup',
                component: SetupLayout,
                children: [
                    { name: 'setup', path: '', component: SetupHomePanel },
                    { name: 'connectors', path: 'connectors/:id?', component: PluginList },
                    { name: 'context', path: 'context/:id?', component: ContextModelList },
                    { name: 'presenters', path: 'presenters/:id?', component: PluginList },
                    { name: 'cookbooks', path: 'cookbooks/:id?', component: PluginList },
                    { name: 'tools', path: 'tools/:id?', component: PluginList }
                ]
            }
        ]
    },
    { path: '/:catchAll(.*)', redirect: '/' }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Which 'RouterView' level is waiting on a chunk, or undefined when none is. Each host shows a spinner when this
// matches its own level. It is the only busy signal there is: 'RouterView' gives no feedback during a navigation, it
// just keeps the old screen up until the new one is ready.
export const navigationPendingDepth = shallowRef<number | undefined>();

// The level waiting on a chunk, held until 'VISIBLE_DELAY_MS' has passed and the timer copies it into
// 'navigationPendingDepth'. The delay stops a fast load flashing a spinner.
const pending = { depth: undefined as number | undefined, timer: undefined as ReturnType<typeof setTimeout> | undefined };

const queryUpdatesByRouter = new WeakMap<Router, QueryUpdate>();

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function createAppRouter(): Router {
    const router = createRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: APP_ROUTES
    });

    if (import.meta.env.DEV) assertViewDepths(APP_ROUTES);

    // Once a newer version is deployed, moving to another screen loads it as a fresh page instead, so the user arrives
    // on the new version. A change to the query alone, such as opening a pane or dialog, is left alone.
    router.beforeEach((to, from) => {
        if (to.path === from.path || !canReloadForNewAppVersion()) return true;
        reloadForNewAppVersion(to.fullPath);
        return false;
    });

    // Runs for completed and aborted navigations. Ones that error reach only 'router.onError'. Both clear the spinner.
    router.afterEach((_to, _from, failure) => {
        // A cancelled navigation was replaced by a newer one, which may still be loading chunks. The newer one clears
        // the spinner when it finishes.
        if (isNavigationFailure(failure, NavigationFailureType.cancelled)) return;
        clearNavigationPending();
    });

    // A failed navigation never reached a view, so there is no region that could render the error and it goes to the
    // app-level failure dialog.
    router.onError((error, to) => {
        clearNavigationPending();

        // The URL never changed, so a reload would otherwise fetch the page the user was leaving. Passing the
        // abandoned destination lets it finish the journey instead.
        const data = { typeId: 'navigation' };
        raiseAppFailure(new AppError('Navigation failed.', 'dpuse-app.router.createAppRouter', data, { cause: error }), { reloadPath: to.fullPath });
    });

    return router;
}

// A failed navigation is already reported by 'router.onError' in 'createAppRouter', so a caller only needs to stop the
// rejection being reported a second time as unhandled. Never rejects, so it can be awaited or left to run.
export async function ignoreReportedNavigationFailure(navigation: Promise<unknown>): Promise<void> {
    try {
        await navigation;
    } catch {
        // Already reported by 'router.onError'.
    }
}

// Changes the URL query without leaving the screen. Changes made in the same tick are merged into one 'router.replace',
// and each write waits for the one before, so no change is lost to another that read the URL before it was updated. An
// undefined value removes the parameter. Never rejects, as 'ignoreReportedNavigationFailure'.
export function replaceRouteQuery(router: Router, changes: LocationQueryRaw): Promise<void> {
    const queryUpdate = queryUpdatesByRouter.get(router) ?? { changes: {}, flush: undefined, settled: Promise.resolve() };
    queryUpdatesByRouter.set(router, queryUpdate);
    Object.assign(queryUpdate.changes, changes);
    queryUpdate.flush ??= writeQueryUpdate(router, queryUpdate);
    queryUpdate.settled = queryUpdate.flush;
    return queryUpdate.flush;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The depths are hand-written, so a re-nested route would silently show the wrong level's spinner and nothing else
// would catch it. A record with no component of its own (':dataViewId') does not add a level, matching how 'RouterView'
// treats it. Logs rather than throws: a misplaced spinner is not worth blocking startup for.
function assertViewDepths(routes: RouteRecordRaw[], depth = 0): void {
    for (const route of routes) {
        const loader = 'component' in route ? (route.component as Partial<RouteComponentLoader> | undefined) : undefined;
        if (loader?.viewDepth != null && loader.viewDepth !== depth) {
            console.error(`Route component '${loader.label ?? route.path}' declares view depth ${String(loader.viewDepth)} but sits at ${String(depth)}.`);
        }
        if (route.children) assertViewDepths(route.children, loader == null ? depth : depth + 1);
    }
}

function clearNavigationPending(): void {
    clearTimeout(pending.timer);
    pending.depth = pending.timer = undefined;
    navigationPendingDepth.value = undefined;
}

// eslint-disable-next-line unicorn/no-unnecessary-parameters -- Kept for the development-only load simulation, switched on by passing one at a call site.
function defineLazyLoader(label: string, depth: number, loader: () => Promise<Component>, simulation?: AsyncPanelSimulation): RouteComponentLoader {
    const developmentLoader = addDevelopmentFaults(loader, label, simulation);
    const routeLoader = (): Promise<Component> => {
        // Tells the 'RouterView' at this level to show a spinner while the chunk is fetched. The shallowest level
        // wins, since its spinner covers the levels below. Delayed, so a fast load does not flash one.
        if (pending.depth == null || depth < pending.depth) {
            pending.depth = depth;
            pending.timer ??= setTimeout(() => (navigationPendingDepth.value = pending.depth), VISIBLE_DELAY_MS);
        }

        const componentPromise = loadRouteComponent(label, developmentLoader);
        void componentPromise.catch(() => {
            // Stops a duplicate report. vue-router starts every level's loader at once but listens to them one at a
            // time, so a chunk failing before its turn has no listener and the browser reports it as unhandled.
            // Nothing is lost: 'router.onError' still gets it.
        });
        return componentPromise;
    };
    routeLoader.label = label;
    routeLoader.viewDepth = depth;
    return routeLoader;
}

// Loads the chunk, wrapping any failure in an error that names the component.
async function loadRouteComponent(label: string, loader: () => Promise<Component>): Promise<Component> {
    try {
        return await loader();
    } catch (error) {
        const data = { componentName: label, typeId: 'componentLoad' };
        throw new AppError(`Failed to load the ${label} route component.`, 'dpuse-app.router.loadRouteComponent', data, { cause: error });
    }
}

async function writeQueryUpdate(router: Router, queryUpdate: QueryUpdate): Promise<void> {
    await queryUpdate.settled;
    const query = { ...router.currentRoute.value.query, ...queryUpdate.changes };
    queryUpdate.changes = {};
    queryUpdate.flush = undefined;
    await ignoreReportedNavigationFailure(router.replace({ query }));
}
