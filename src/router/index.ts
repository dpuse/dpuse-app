// ── External Dependencies & Registrations
import { type Component, shallowRef } from 'vue';
import { createRouter, createWebHistory, type Router, type RouteRecordRaw, type RouterScrollBehavior } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { raiseAppLevelError } from '@/state/errors';
import { type AsyncPanelSimulation, VISIBLE_DELAY_MS } from '@/utilities/index.ts';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The depth is carried on the loader itself so 'assertViewDepths' can read back what each route declared. Nothing
// reaches it through vue-router, which calls a loader with no arguments and no context.
interface RouteComponentLoader {
    (): Promise<Component>;
    label: string;
    viewDepth: number;
}

// ── Dynamic Components
//
// Every loader is wrapped, for two reasons. A chunk that will not fetch is reported against the component it was meant
// to produce rather than as a bare URL — the label is the only thing at this point that knows what was being loaded,
// since the router reports 'Navigation failed.' and the platform message names a hashed file. And the loader running
// at all is what raises the busy state: vue-router calls a loader only for a record the navigation is entering, so
// there is nothing to work out about which view is being replaced.
//
// The number is the nesting level of the 'RouterView' that renders the component — 'App.vue' is 0, the studio layouts
// below it are 1. Checked against the route table at startup by 'assertViewDepths', which is the only thing keeping it
// honest if a route is ever re-nested.
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
const ManageConnectorList = defineLazyLoader('ManageConnectorList', 1, () => import('@/studio/manageConfig/connectors/ConnectorList.vue'), { failsToLoad: false });
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

// Navigation — a navigation waits on its route components' chunks, so it is the navigation that is busy, not any one
// component. 'RouterView' has no busy state of its own: through a navigation it keeps rendering the component it
// already holds, then swaps in one step, so the stand-in has to be raised by the host whose child is being replaced.
//
// The nesting level of that host, or undefined when nothing is pending. Every host asks the same question of it — am I
// the one being replaced — which is why this is a level rather than a set of flags: a rule that reads the same at every
// depth needs no exception for the outermost, and a level added later works without touching anything here.
export const navigationPendingDepth = shallowRef<number | undefined>();

// Held outside the ref because the level is known the moment a loader runs while the spinner must not appear for
// 'VISIBLE_DELAY_MS'. Not reactive: nothing may render from it before the timer promotes it.
const pending = { depth: undefined as number | undefined, timer: undefined as ReturnType<typeof setTimeout> | undefined };

// ── Router Creation Function ─────────────────────────────────────────────────────────────────────────────────────────

export const createAppRouter = (): Router => {
    const router = createRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: APP_ROUTES,
        scrollBehavior: handleScrollBehavior
    });

    if (import.meta.env.DEV) assertViewDepths(APP_ROUTES);

    // Runs for completed and aborted navigations alike; 'onError' covers the rest, so no path leaves the spinner up.
    router.afterEach(() => {
        clearNavigationPending();
    });

    // A navigation that errors leaves no view to render into, so the error cannot be shown in place: a lazily loaded
    // route component that will not fetch is a stale deployment, and anything else is fatal.
    router.onError((error, to) => {
        clearNavigationPending();

        // 'to' is passed on so the banner's refresh can resume the navigation this abandoned. The URL never changed —
        // the navigation was given up rather than completed — so reloading in place would return the user to the
        // screen they were leaving, having cleared the stale deployment but lost where they were going.
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

// The depth each loader declares is a transcription of where its record sits, and nothing else would notice it going
// stale — a re-nested route would simply raise the wrong view's spinner. Walks the table the way 'RouterView' walks the
// matched list, counting only records that render something, and complains rather than throwing: a wrong spinner is not
// worth refusing to start over, and this never runs for a user.
function assertViewDepths(routes: RouteRecordRaw[], depth = 0): void {
    for (const route of routes) {
        const loader = 'component' in route ? (route.component as Partial<RouteComponentLoader> | undefined) : undefined;
        if (loader?.viewDepth != null && loader.viewDepth !== depth) {
            // Named by its label rather than its path, which is '' for every index route and so identifies nothing.
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
        // Tells the 'RouterView' at this level to show a spinner while the chunk is fetched. Shallowest level wins,
        // since its spinner covers the levels below. Delayed, so a fast load does not flash one.
        if (pending.depth == null || depth < pending.depth) {
            pending.depth = depth;
            pending.timer ??= setTimeout(() => (navigationPendingDepth.value = pending.depth), VISIBLE_DELAY_MS);
        }

        const componentPromise = loadRouteComponent(label, loader, simulation);
        void componentPromise.catch(() => {
            // Stops a duplicate error report. When a navigation enters more than one level at once, vue-router starts all
            // of their loaders together but listens to them one at a time, outermost first. A chunk failing before its turn
            // has nobody listening, so the browser reports it as unhandled. Nothing is lost — 'router.onError' still gets it.
        });
        return componentPromise;
    };
    routeLoader.label = label;
    routeLoader.viewDepth = depth;
    return routeLoader;
}

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
