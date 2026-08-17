// ── External Dependencies & Registrations
import { createRouter, createWebHistory, type Router, type RouterScrollBehavior, START_LOCATION } from 'vue-router';

// ── Local Framework
import { load } from '@/state/component';
import { complete, fail, start } from '@/state/navigation';

// ── Local Components - Dynamic
const StudioHomeLayout = load('StudioHomeLayout', () => import('@/studio/home/StudioHomeLayout.vue'));

// ── Local Components - Dynamic - Establish Data Views
const EstablishDataViewsLayout = load('EstablishDataViews', () => import('@/studio/establishDataViews/EstablishDataViewsLayout.vue'));
const DataViewList = load('DataViewList', () => import('@/studio/establishDataViews/DataViewList.vue'));
const SelectConnectionList = load('SelectConnection', () => import('@/studio/establishDataViews/selectConnection/SelectConnectionList.vue'));
const SelectItemPanel = load('SelectItem', () => import('@/studio/establishDataViews/selectItem/SelectItemPanel.vue'));
const AuditContentPanel = load('AuditContent', () => import('@/studio/establishDataViews/auditContent/AuditContentPanel.vue'));
const ExploreData = load('ExploreData', () => import('@/studio/establishDataViews/exploreData/ExploreData.vue'));

// ── Local Components - Dynamic - Contextualise Data
const ContextualiseDataLayout = load('ContextualiseData', () => import('@/studio/contextualiseData/ContextualiseDataLayout.vue'));
const EventQueryList = load('EventQueryList', () => import('@/studio/contextualiseData/EventQueryList.vue'));

// ── Local Components - Dynamic - Explore Presentations
const ExplorePresentationsLayout = load('ExplorePresentations', () => import('@/studio/explorePresentations/ExplorePresentationsLayout.vue'));

// ── Local Components - Dynamic - Build Data Apps
const BuildDataAppsLayout = load('BuildDataApps', () => import('@/studio/buildDataApps/BuildDataAppsLayout.vue'));

// ── Local Components - Dynamic - Manage Configs
const ManageConfigsLayout = load('ManageConfig', () => import('@/studio/manageConfig/ManageConfigLayout.vue'));
const ManageHomePanel = load('ManageHomePanel', () => import('@/studio/manageConfig/home/HomePanel.vue'));
const ManageConnectorList = load('ManageConnectorList', () => import('@/studio/manageConfig/connectors/ConnectorList.vue'));
const ManageContextList = load('ManageContextList', () => import('@/studio/manageConfig/context/ContextList.vue'));
const ManagePresenterList = load('ManagePresenterList', () => import('@/studio/manageConfig/presenters/PresenterList.vue'));
const ManageCookbooksList = load('ManageCookbooksList', () => import('@/studio/manageConfig/cookbooks/CookbookList.vue'));
const ManageToolsList = load('ManageToolsList', () => import('@/studio/manageConfig/tools/ToolList.vue'));

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
        if (from === START_LOCATION) {
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
        }

        start();
    });

    router.afterEach(() => complete());
    router.onError(() => fail());

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
