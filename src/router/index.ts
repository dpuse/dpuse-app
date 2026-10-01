// ── External Dependencies & Registrations
import { promiseTimeout } from '@vueuse/core';
import { type Component, shallowRef } from 'vue';
import { createRouter, createWebHistory, isNavigationFailure, NavigationFailureType, type Router, type RouteRecordRaw, type RouterScrollBehavior } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { raiseAppFailure } from '@/state/errors';
import { type AsyncPanelSimulation, VISIBLE_DELAY_MS } from '@/utilities/index.ts';
import { throwOnFault, throwOnStaleFault } from '@/observability/faultInjection';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// A lazy route component is just a loader function, so the label and depth ride on it as properties. They are there
// for 'assertViewDepths', which reads them straight off the route table.
interface RouteComponentLoader {
    (): Promise<Component>;
    label: string;
    viewDepth: number;
}

// ── Dynamic Components
// Every loader is wrapped so that a failed chunk can be reported by name, and so that loading one raises the spinner.
// The number is the nesting level of the 'RouterView' that renders the component: 'App.vue' is 0, the studio layouts
// below it are 1. 'assertViewDepths' checks these against the route table at startup in Dev environment.
const StudioHomePanel = defineLazyLoader('StudioHomePanel', 0, () => import('~/src/features/studio/StudioHomePanel.vue'));
const DataViewsLayout = defineLazyLoader('DataViewsLayout', 0, () => import('@/features/studio/dataViews/DataViewsLayout.vue'));
const DataViewList = defineLazyLoader('DataViewList', 1, () => import('@/features/studio/dataViews/DataViewList.vue'));
const SelectConnectionList = defineLazyLoader('SelectConnectionList', 1, () => import('@/features/studio/dataViews/selectConnection/SelectConnectionList.vue'));
const SelectItemPanel = defineLazyLoader('SelectItemPanel', 1, () => import('@/features/studio/dataViews/selectItem/SelectItemPanel.vue'));
const AuditContentPanel = defineLazyLoader('AuditContentPanel', 1, () => import('@/features/studio/dataViews/auditContent/AuditContentPanel.vue'));
const ExploreDataPanel = defineLazyLoader('ExploreDataPanel', 1, () => import('@/features/studio/dataViews/exploreData/ExploreDataPanel.vue'));
const EventQueriesLayout = defineLazyLoader('EventQueriesLayout', 0, () => import('@/features/studio/eventQueries/EventQueriesLayout.vue'));
const PresentationsLayout = defineLazyLoader('PresentationsLayout', 0, () => import('@/features/studio/presentations/PresentationsLayout.vue'));
const DataAppsLayout = defineLazyLoader('DataAppsLayout', 0, () => import('@/features/studio/dataApps/DataAppsLayout.vue'));
const SetupLayout = defineLazyLoader('SetupLayout', 0, () => import('@/features/studio/setup/SetupLayout.vue'));
const SetupHomePanel = defineLazyLoader('SetupHomePanel', 1, () => import('@/features/studio/setup/SetupHomePanel.vue'));
const ContextModelList = defineLazyLoader('ContextModelList', 1, () => import('@/features/studio/setup/context/ContextModelList.vue'));
const PluginList = defineLazyLoader('PluginList', 1, () => import('@/features/studio/setup/plugins/_components/PluginList.vue'));

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
                            { name: 'connections', path: 'connections', component: SelectConnectionList },
                            { name: 'items', path: 'items', component: SelectItemPanel },
                            { name: 'content', path: 'content', component: AuditContentPanel },
                            { name: 'data', path: 'data', component: ExploreDataPanel }
                        ]
                    }
                ]
            },
            { name: 'eventQueries', path: 'eventQueries', component: EventQueriesLayout },
            { name: 'presentations', path: 'presentations', component: PresentationsLayout },
            { name: 'dataApps', path: 'dataApps', component: DataAppsLayout },
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

// Query keys that hold a list's row selection for its own route only (written via 'router.replace' by the route
// that owns each one, to survive a reload or deep link there) — see 'SelectConnectionList', 'SelectItemPanel'.
// Never meant to outlive that route: whatever a selection actually decided is saved into real state before the app
// moves on, so carrying the id itself past its own route is pure query-string litter, not state anything depends
// on. 'PluginList'/'ContextModelList' and 'DataViewList' use an optional path param ('id',
// 'dataViewId') for the same purpose instead — those need no entry here, since a path param is naturally scoped to
// the one route that declares it and cannot leak into a different route's query the way these can.
const ROUTE_SCOPED_QUERY_KEYS = new Set(['connectionId', 'itemId']);

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Which 'RouterView' level is waiting on a chunk, or undefined when none is. Each host shows a spinner when this
// matches its own level. It is the only busy signal there is: 'RouterView' gives no feedback during a navigation, it
// just keeps the old screen up until the new one is ready.
export const navigationPendingDepth = shallowRef<number | undefined>();

// Staging for the ref above. The level is known the moment a loader runs, but the spinner must not appear for
// 'VISIBLE_DELAY_MS' yet, so it is held here — plain and non-reactive — until the timer copies it across.
const pending = { depth: undefined as number | undefined, timer: undefined as ReturnType<typeof setTimeout> | undefined };

// ── Router Creation Function ─────────────────────────────────────────────────────────────────────────────────────────

export const createAppRouter = (): Router => {
    const router = createRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: APP_ROUTES
        // scrollBehavior: handleScrollBehavior
    });

    if (import.meta.env.DEV) assertViewDepths(APP_ROUTES);

    // Strips a route-scoped selection id the moment it would cross into a different route. This is the one place
    // that enforces it: call sites throughout the app forward the current query wholesale (`query: route.query`),
    // and there is no way to stop a selection id riding along with it short of auditing every one of those call
    // sites — fragile, and the last attempt at that missed cases. Guarding the navigation itself means it does not
    // matter how many places spread the query forward.
    router.beforeEach((to, from) => {
        if (from.matched.length === 0 || to.name === from.name) return; // Initial load/reload, or writing the selection via a same-route 'replace' — nothing to strip.

        const query = Object.fromEntries(Object.entries(to.query).filter(([key]) => !ROUTE_SCOPED_QUERY_KEYS.has(key)));
        if (Object.keys(query).length === Object.keys(to.query).length) return; // Nothing to strip.

        return { name: to.name, params: to.params, query, hash: to.hash };
    });

    // Runs for completed and aborted navigations; ones that error only reach 'onError' below. Between the two, the
    // spinner is always cleared.
    router.afterEach((_to, _from, failure) => {
        // Except for a cancelled navigation, which means a newer one superseded it. That one now owns the pending
        // state — its chunks may still be fetching — and will clear it itself when it settles.
        if (isNavigationFailure(failure, NavigationFailureType.cancelled)) return;
        clearNavigationPending();
    });

    // A failed navigation never reached a view, so there is no region that could render the error and it goes to the
    // app-level strip.
    router.onError((error, to) => {
        clearNavigationPending();

        // The URL never changed, so a reload would otherwise fetch the page the user was leaving. Passing the
        // abandoned destination lets it finish the journey instead.
        const data = { typeId: 'navigation' };
        raiseAppFailure(new AppError('Navigation failed.', 'dpuse-app.router.createAppRouter', data, { cause: error }), { reloadPath: to.fullPath });
    });

    return router;
};

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleScrollBehavior(
    _to: Parameters<RouterScrollBehavior>[0],
    _from: Parameters<RouterScrollBehavior>[1],
    savedPosition: Parameters<RouterScrollBehavior>[2]
): ReturnType<RouterScrollBehavior> {
    return savedPosition ? { ...savedPosition, behavior: 'auto' } : { left: 0, top: 0 }; // NOTE: "behavior: 'auto'" required for Safari iOS v18.3.2.
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

function defineLazyLoader(label: string, depth: number, loader: () => Promise<Component>, simulation?: AsyncPanelSimulation): RouteComponentLoader {
    const routeLoader = (): Promise<Component> => {
        // Tells the 'RouterView' at this level to show a spinner while the chunk is fetched. The shallowest level
        // wins, since its spinner covers the levels below. Delayed, so a fast load does not flash one.
        if (pending.depth == null || depth < pending.depth) {
            pending.depth = depth;
            pending.timer ??= setTimeout(() => (navigationPendingDepth.value = pending.depth), VISIBLE_DELAY_MS);
        }

        const componentPromise = loadRouteComponent(label, loader, simulation);
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

// Loads the chunk, wrapping any failure in an error that names the component. The development-only simulation can slow
// or fail the load; the simulated failure copies Chromium's wording for an unfetchable chunk so it is classified as a
// stale deployment, exactly as the real thing would be.
async function loadRouteComponent(label: string, loader: () => Promise<Component>, simulation?: AsyncPanelSimulation): Promise<Component> {
    try {
        if (import.meta.env.DEV) {
            throwOnFault('route', label, `Simulated ${label} route load failure.`);
            throwOnStaleFault('route-stale', label);
        }
        if (simulation && import.meta.env.DEV) {
            const { delayMs = 0, failsToLoad = false } = simulation;
            if (delayMs > 0) await promiseTimeout(delayMs);
            if (failsToLoad) throw new TypeError('Failed to fetch dynamically imported module: simulated route load failure.');
        }
        return await loader();
    } catch (error) {
        const data = { componentName: label, typeId: 'componentLoad' };
        throw new AppError(`Failed to load the ${label} route component.`, 'dpuse-app.router.loadRouteComponent', data, { cause: error });
    }
}
