// ── External Dependencies & Registrations
import { type Component, shallowRef } from 'vue';
import { createRouter, createWebHistory, isNavigationFailure, NavigationFailureType, type Router, type RouteRecordRaw, type RouterScrollBehavior } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { raiseAppLevelError } from '@/state/errors';
import { type AsyncPanelSimulation, VISIBLE_DELAY_MS } from '@/utilities/index.ts';

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
const StudioHomeLayout = defineLazyLoader('StudioHomeLayout', 0, () => import('@/studio/home/StudioHomeLayout.vue'));
const EstablishDataViewsLayout = defineLazyLoader('EstablishDataViewsLayout', 0, () => import('@/studio/establishDataViews/EstablishDataViewsLayout.vue'));
const DataViewList = defineLazyLoader('DataViewList', 1, () => import('@/studio/establishDataViews/DataViewList.vue'));
const SelectConnectionList = defineLazyLoader('SelectConnectionList', 1, () => import('@/studio/establishDataViews/selectConnection/SelectConnectionList.vue'));
const SelectItemPanel = defineLazyLoader('SelectItemPanel', 1, () => import('@/studio/establishDataViews/selectItem/SelectItemPanel.vue'));
const AuditContentPanel = defineLazyLoader('AuditContentPanel', 1, () => import('@/studio/establishDataViews/auditContent/AuditContentPanel.vue'));
const ExploreData = defineLazyLoader('ExploreData', 1, () => import('@/studio/establishDataViews/exploreData/ExploreData.vue'));
const ContextualiseDataLayout = defineLazyLoader('ContextualiseDataLayout', 0, () => import('@/studio/contextualiseData/ContextualiseDataLayout.vue'));
const ExplorePresentationsLayout = defineLazyLoader('ExplorePresentationsLayout', 0, () => import('@/studio/explorePresentations/ExplorePresentationsLayout.vue'));
const BuildDataAppsLayout = defineLazyLoader('BuildDataAppsLayout', 0, () => import('@/studio/buildDataApps/BuildDataAppsLayout.vue'));
const ManageConfigLayout = defineLazyLoader('ManageConfigLayout', 0, () => import('@/studio/manageConfig/ManageConfigLayout.vue'));
const ManageHomePanel = defineLazyLoader('ManageHomePanel', 1, () => import('@/studio/manageConfig/home/HomePanel.vue'));
const ManageConnectorList = defineLazyLoader('ManageConnectorList', 1, () => import('@/studio/manageConfig/connectors/ConnectorList.vue'));
const ManageContextList = defineLazyLoader('ManageContextList', 1, () => import('@/studio/manageConfig/context/ContextList.vue'));
const ManagePresenterList = defineLazyLoader('ManagePresenterList', 1, () => import('@/studio/manageConfig/presenters/PresenterList.vue'));
const ManageCookbookList = defineLazyLoader('ManageCookbookList', 1, () => import('@/studio/manageConfig/cookbooks/CookbookList.vue'));
const ManageToolList = defineLazyLoader('ManageToolList', 1, () => import('@/studio/manageConfig/tools/ToolList.vue'));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const APP_ROUTES = [
    {
        path: '/',
        children: [
            { name: 'studio', path: '', component: StudioHomeLayout },
            {
                path: 'establishDataViews',
                component: EstablishDataViewsLayout,
                children: [
                    { name: 'establishDataViews', path: '', component: DataViewList },
                    {
                        path: ':dataViewId',
                        children: [
                            { name: 'selectConnection', path: 'selectConnection', component: SelectConnectionList },
                            { name: 'selectItem', path: 'selectItem', component: SelectItemPanel },
                            { name: 'auditContent', path: 'auditContent', component: AuditContentPanel },
                            { name: 'exploreData', path: 'investigate', component: ExploreData }
                        ]
                    }
                ]
            },
            { name: 'contextualiseData', path: 'contextualiseData', component: ContextualiseDataLayout },
            { name: 'explorePresentations', path: 'explorePresentations', component: ExplorePresentationsLayout },
            { name: 'buildDataApps', path: 'buildDataApps', component: BuildDataAppsLayout },
            {
                path: 'manageConfig',
                component: ManageConfigLayout,
                children: [
                    { name: 'manageConfig', path: '', component: ManageHomePanel },
                    { name: 'manageConnectors', path: 'connectors', component: ManageConnectorList },
                    { name: 'manageConfigContext', path: 'context', component: ManageContextList },
                    { name: 'managePresenters', path: 'presenters', component: ManagePresenterList },
                    { name: 'manageCookbooks', path: 'cookbooks', component: ManageCookbookList },
                    { name: 'manageTools', path: 'tools', component: ManageToolList }
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

// Staging for the ref above. The level is known the moment a loader runs, but the spinner must not appear for
// 'VISIBLE_DELAY_MS' yet, so it is held here — plain and non-reactive — until the timer copies it across.
const pending = { depth: undefined as number | undefined, timer: undefined as ReturnType<typeof setTimeout> | undefined };

// ── Router Creation Function ─────────────────────────────────────────────────────────────────────────────────────────

export const createAppRouter = (): Router => {
    const router = createRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: APP_ROUTES,
        scrollBehavior: handleScrollBehavior
    });

    if (import.meta.env.DEV) assertViewDepths(APP_ROUTES);

    // Runs for completed and aborted navigations; ones that error only reach 'onError' below. Between the two, the
    // spinner is always cleared.
    router.afterEach((_to, _from, failure) => {
        // Except for a cancelled navigation, which means a newer one superseded it. That one now owns the pending
        // state — its chunks may still be fetching — and will clear it itself when it settles.
        if (isNavigationFailure(failure, NavigationFailureType.cancelled)) return;
        clearNavigationPending();
    });

    // A failed navigation has no view to render the error into, so it goes to the app-level handler: a route chunk
    // that will not fetch means a stale deployment, anything else is fatal.
    router.onError((error, to) => {
        clearNavigationPending();

        // The URL never changed, so the banner's refresh would otherwise reload the page the user was leaving. Passing
        // the abandoned destination lets it finish the journey instead.
        const data = { typeId: 'navigation' };
        raiseAppLevelError(new AppError('Navigation failed.', 'dpuse.router', data, { cause: error }), to.fullPath);
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
        if (simulation && import.meta.env.DEV) {
            const { delayMs = 0, failsToLoad = false } = simulation;
            if (delayMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            if (failsToLoad) throw new TypeError('Failed to fetch dynamically imported module: simulated route load failure.');
        }
        return await loader();
    } catch (error) {
        const data = { componentName: label, typeId: 'componentLoad' };
        throw new AppError(`Failed to load the ${label} route component.`, 'dpuse.componentLoadFailure', data, { cause: error });
    }
}
