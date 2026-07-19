// ── External Dependencies & Registrations
import { createRouter, createWebHistory, type Router, type RouterScrollBehavior, START_LOCATION } from 'vue-router';

// ── Local Framework
import { load } from '@/state/component';
import { complete, fail, start } from '@/state/navigation';

// ── Local Components - Dynamic
const WorkbenchHomeLayout = load('WorkbenchHomeLayout', () => import('@/domains/workbench/home/HomeLayout.vue'));

// ── Local Components - Dynamic - Establish Data Views
const EstablishDataViewsLayout = load('EstablishDataViews', () => import('@/domains/workbench/establishDataViews/EstablishDataViewsLayout.vue'));
const DataViewList = load('DataViewList', () => import('@/domains/workbench/establishDataViews/DataViewList.vue'));
const SelectConnectionPanel = load('SelectConnection', () => import('@/domains/workbench/establishDataViews/selectConnection/SelectConnectionPanel.vue'));
const SelectItemPanel = load('SelectItem', () => import('@/domains/workbench/establishDataViews/selectItem/SelectItemPanel.vue'));
const AuditContentPanel = load('AuditContent', () => import('@/domains/workbench/establishDataViews/auditContent/AuditContentPanel.vue'));
const ExploreData = load('ExploreData', () => import('@/domains/workbench/establishDataViews/exploreData/ExploreData.vue'));

// ── Local Components - Dynamic - Manage Configs/Contexts
// const ManageContextsLayout = load('ManageContexts', () => import('@/domains/workbench/manageContexts/ManageContextsLayout.vue'));

// ── Local Components - Dynamic - Assemble Dimensions
const AssembleDimensionsLayout = load('AssembleDimensions', () => import('@/domains/workbench/assembleDimensions/AssembleDimensionsLayout.vue'));
const DimensionList = load('DimensionList', () => import('@/domains/workbench/assembleDimensions/DimensionList.vue'));

// ── Local Components - Dynamic - Contextualise Data
const ContextualiseDataLayout = load('ContextualiseData', () => import('@/domains/workbench/contextualiseData/ContextualiseDataLayout.vue'));
const EventQueryList = load('EventQueryList', () => import('@/domains/workbench/contextualiseData/EventQueryList.vue'));

// ── Local Components - Dynamic - Explore Presentations
const ExplorePresentationsLayout = load('ExplorePresentations', () => import('@/domains/workbench/explorePresentations/ExplorePresentationsLayout.vue'));

// ── Local Components - Dynamic - Build Data Apps
const BuildDataAppsLayout = load('BuildDataApps', () => import('@/domains/workbench/buildDataApps/BuildDataAppsLayout.vue'));

// ── Local Components - Dynamic - Manage Configs
const ManageConfigsLayout = load('ManageConfigs', () => import('@/domains/workbench/manageConfigs/ManageConfigsLayout.vue'));
const ManageHomePanel = load('ManageHomePanel', () => import('@/domains/workbench/manageConfigs/home/HomePanel.vue'));
const ManageConnectionList = load('ManageConnectionList', () => import('@/domains/workbench/manageConfigs/connections/ConnectionList.vue'));
const ManageConnectorList = load('ManageConnectorList', () => import('@/domains/workbench/manageConfigs/connectors/ConnectorList.vue'));
const ManageContextList = load('ManageContextList', () => import('@/domains/workbench/manageConfigs/contexts/ContextList.vue'));
const ManageContextPanel = load('ManageContextPanel', () => import('@/domains/workbench/manageConfigs/contexts/ContextPanel.vue'));
const ManagePresenterList = load('ManagePresenterList', () => import('@/domains/workbench/manageConfigs/presenters/PresenterList.vue'));
const ManageCookbooksList = load('ManageCookbooksList', () => import('@/domains/workbench/manageConfigs/cookbooks/CookbookList.vue'));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export const APP_ROUTES = [
    {
        path: '/',
        children: [
            { path: '', component: { render: (): null => null } }, // Matches exactly '/'. beforeEach handles the default redirect to knowledge about.
            {
                path: 'workbench',
                children: [
                    { name: 'workbench', path: '', component: WorkbenchHomeLayout },
                    {
                        path: 'establishDataViews',
                        component: EstablishDataViewsLayout,
                        children: [
                            { name: 'establishDataViews', path: '', component: DataViewList },
                            {
                                path: ':dataViewId',
                                children: [
                                    { name: 'selectConnection', path: 'selectConnection', component: SelectConnectionPanel },
                                    { name: 'selectItem', path: 'selectItem', component: SelectItemPanel },
                                    { name: 'auditContent', path: 'auditContent', component: AuditContentPanel },
                                    { name: 'exploreData', path: 'investigate', component: ExploreData }
                                ]
                            }
                        ]
                    },
                    // { name: 'manageContexts', path: 'manageContexts', component: ManageContextsLayout },
                    { path: 'assembleDimensions', component: AssembleDimensionsLayout, children: [{ name: 'assembleDimensions', path: '', component: DimensionList }] },
                    { path: 'contextualiseData', component: ContextualiseDataLayout, children: [{ name: 'contextualiseData', path: '', component: EventQueryList }] },
                    {
                        path: 'explorePresentations',
                        component: ExplorePresentationsLayout,
                        children: [{ name: 'explorePresentations', path: '', component: { render: (): null => null } }]
                    },
                    { name: 'buildDataApps', path: 'buildDataApps', component: BuildDataAppsLayout },
                    {
                        path: 'manageConfigs',
                        component: ManageConfigsLayout,
                        children: [
                            { name: 'manageConfigs', path: '', component: ManageHomePanel },
                            { name: 'manageConnections', path: 'connections', component: ManageConnectionList },
                            { name: 'manageConnectors', path: 'connectors', component: ManageConnectorList },
                            { name: 'manageContexts', path: 'contexts', component: ManageContextList },
                            { name: 'manageContext', path: 'contexts/:contextId', component: ManageContextPanel },
                            { name: 'managePresenters', path: 'presenters', component: ManagePresenterList },
                            { name: 'manageCookbooks', path: 'cookbooks', component: ManageCookbooksList }
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

    // Default to /workbench when no workbench route or knowledge argument is present.
    router.beforeEach((to, from) => {
        if (from === START_LOCATION) {
            // Then the page is loading.
            if (to.query.wbState !== '1' && to.path !== '/') {
                // Then we can clear the workbench part of the url if it was not visible. This defers loading the view until required.
                return { path: '/', query: { ...to.query, d: undefined, wbState: undefined, wbView: to.query.wbView ?? 'workbench', kState: 1, kView: to.query.kView ?? 'about' } };
            }
            if (to.path === '/' && (!('kView' in to.query) || !('kState' in to.query))) {
                return { path: '/workbench', query: { ...to.query, d: undefined, wbState: 1, wbView: 'workbench', kState: undefined, kView: undefined } };
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
