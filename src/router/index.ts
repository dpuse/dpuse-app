// ── External Dependencies & Registrations
import { createRouter, createWebHistory, type Router, type RouterScrollBehavior, START_LOCATION } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { defineAsyncPanel } from '@/utilities/index.ts';
import { raiseAppLevelError } from '@/state/errors';

// ── Dynamic Components
const StudioHomeLayout = defineAsyncPanel(() => import('@/studio/home/StudioHomeLayout.vue'), 'StudioHomeLayout');

// ── Dynamic Components - Establish Data Views
const EstablishDataViewsLayout = defineAsyncPanel(() => import('@/studio/establishDataViews/EstablishDataViewsLayout.vue'), 'EstablishDataViews');
const DataViewList = defineAsyncPanel(() => import('@/studio/establishDataViews/DataViewList.vue'), 'DataViewList');
const SelectConnectionList = defineAsyncPanel(() => import('@/studio/establishDataViews/selectConnection/SelectConnectionList.vue'), 'SelectConnection');
const SelectItemPanel = defineAsyncPanel(() => import('@/studio/establishDataViews/selectItem/SelectItemPanel.vue'), 'SelectItem');
const AuditContentPanel = defineAsyncPanel(() => import('@/studio/establishDataViews/auditContent/AuditContentPanel.vue'), 'AuditContent');
const ExploreData = defineAsyncPanel(() => import('@/studio/establishDataViews/exploreData/ExploreData.vue'), 'ExploreData');

// ── Dynamic Components - Contextualise Data
const ContextualiseDataLayout = defineAsyncPanel(() => import('@/studio/contextualiseData/ContextualiseDataLayout.vue'), 'ContextualiseData');
const EventQueryList = defineAsyncPanel(() => import('@/studio/contextualiseData/EventQueryList.vue'), 'EventQueryList');

// ── Dynamic Components - Explore Presentations
const ExplorePresentationsLayout = defineAsyncPanel(() => import('@/studio/explorePresentations/ExplorePresentationsLayout.vue'), 'ExplorePresentations');

// ── Dynamic Components - Build Data Apps
const BuildDataAppsLayout = defineAsyncPanel(() => import('@/studio/buildDataApps/BuildDataAppsLayout.vue'), 'BuildDataApps', { simulation: { delayMs: 3000 } });

// ── Dynamic Components - Manage Configs
const ManageConfigsLayout = defineAsyncPanel(() => import('@/studio/manageConfig/ManageConfigLayout.vue'), 'ManageConfig');
const ManageHomePanel = defineAsyncPanel(() => import('@/studio/manageConfig/home/HomePanel.vue'), 'ManageHomePanel');
const ManageConnectorList = defineAsyncPanel(() => import('@/studio/manageConfig/connectors/ConnectorList.vue'), 'ManageConnectorList');
const ManageContextList = defineAsyncPanel(() => import('@/studio/manageConfig/context/ContextList.vue'), 'ManageContextList');
const ManagePresenterList = defineAsyncPanel(() => import('@/studio/manageConfig/presenters/PresenterList.vue'), 'ManagePresenterList');
const ManageCookbooksList = defineAsyncPanel(() => import('@/studio/manageConfig/cookbooks/CookbookList.vue'), 'ManageCookbooksList');
const ManageToolsList = defineAsyncPanel(() => import('@/studio/manageConfig/tools/ToolList.vue'), 'ManageToolsList');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const APP_ROUTES = [
    {
        path: '/',
        children: [
            { path: '', component: { render: (): null => null } }, // Matches exactly '/'. beforeEach handles the default redirect to assistant about.
            {
                path: 'studio',
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
                    { path: 'contextualiseData', component: ContextualiseDataLayout, children: [{ name: 'contextualiseData', path: '', component: EventQueryList }] },
                    {
                        path: 'explorePresentations',
                        component: ExplorePresentationsLayout,
                        children: [{ name: 'explorePresentations', path: '', component: { render: (): null => null } }]
                    },
                    { name: 'buildDataApps', path: 'buildDataApps', component: BuildDataAppsLayout },
                    {
                        path: 'manageConfig',
                        component: ManageConfigsLayout,
                        children: [
                            { name: 'manageConfig', path: '', component: ManageHomePanel },
                            { name: 'manageConnectors', path: 'connectors', component: ManageConnectorList },
                            { name: 'manageConfigContext', path: 'context', component: ManageContextList },
                            { name: 'managePresenters', path: 'presenters', component: ManagePresenterList },
                            { name: 'manageCookbooks', path: 'cookbooks', component: ManageCookbooksList },
                            { name: 'manageTools', path: 'tools', component: ManageToolsList }
                        ]
                    }
                ]
            }
        ]
    },
    { path: '/:catchAll(.*)', redirect: '/' }
];

// ── Router Creation Function ─────────────────────────────────────────────────────────────────────────────────────────

export const createAppRouter = (): Router => {
    const router = createRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: APP_ROUTES,
        scrollBehavior: handleScrollBehavior
    });

    // Default to /studio when no studio route or assistant argument is present.
    router.beforeEach((to, from) => {
        if (from !== START_LOCATION) {
        	return;
        }

        // Then the page is loading.
        if (to.query.sState !== '1' && to.path !== '/') {
            // Then we can clear the studio part of the url if it was not visible. This defers loading the view until required.
            return { path: '/', query: { ...to.query, d: undefined, sState: undefined, sView: to.query.sView ?? 'studio', aState: 1, aView: to.query.aView ?? 'about' } };
        }
        if (to.path === '/' && (!('aView' in to.query) || !('aState' in to.query))) {
            return { path: '/studio', query: { ...to.query, d: undefined, sState: 1, sView: 'studio', aState: undefined, aView: undefined } };
        }
        if ('d' in to.query) {
            return { path: to.path, query: { ...to.query, d: undefined } };
        }
    });

    // A navigation that errors leaves no view to render into, so the error cannot be shown in place: a lazily loaded
    // route component that will not fetch is a stale deployment, and anything else is fatal.
    router.onError((error) => {
        const data = { typeId: 'navigation' };
        raiseAppLevelError(new AppError('Navigation failed.', 'dpuse.router', data, { cause: error }));
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
