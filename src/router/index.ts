// External Dependencies
import { createRouter, createWebHistory, type Router, type RouterScrollBehavior, START_LOCATION } from 'vue-router';

// Local (App) Framework
import { load } from '@/state/component';
import { routeLoadingState } from '@/state/loading';

// Local Components - Dynamic
const AdminHomeLayout = load('Admin', () => import('@/domains/workbench/admin/AdminHomeLayout.vue'));
const PartnerHomeLayout = load('Partner', () => import('@/domains/workbench/partner/PartnerHomeLayout.vue'));
const WorkflowHomeLayout = load('Workflow', () => import('@/domains/workbench/workflow/WorkflowHomeLayout.vue'));

const EstablishDataViewsLayout = load('EstablishDataViews', () => import('@/domains/workbench/workflow/establishDataViews/EstablishDataViewsLayout.vue'));
const DataViewList = load('DataViewList', () => import('@/domains/workbench/workflow/establishDataViews/DataViewList.vue'));
const SelectConnectionPanel = load('SelectConnection', () => import('@/domains/workbench/workflow/establishDataViews/selectConnection/SelectConnectionPanel.vue'));
const SelectItemPanel = load('SelectItem', () => import('@/domains/workbench/workflow/establishDataViews/selectItem/SelectItemPanel.vue'));
const AuditContentPanel = load('AuditContent', () => import('@/domains/workbench/workflow/establishDataViews/auditContent/AuditContentPanel.vue'));
const ExploreData = load('Investigate', () => import('@/domains/workbench/workflow/establishDataViews/exploreData/ExploreData.vue'));

const AssembleDimensionsLayout = load('AssembleDimensions', () => import('@/domains/workbench/workflow/assembleDimensions/AssembleDimensionsLayout.vue'));
const DimensionList = load('DimensionList', () => import('@/domains/workbench/workflow/assembleDimensions/DimensionList.vue'));

const ContextualiseDataLayout = load('ContextualiseData', () => import('@/domains/workbench/workflow/contextualiseData/ContextualiseDataLayout.vue'));
const EventQueryList = load('EventQueryList', () => import('@/domains/workbench/workflow/contextualiseData/EventQueryList.vue'));

const ExplorePresentationsLayout = load('ExplorePresentations', () => import('@/domains/workbench/workflow/explorePresentations/ExplorePresentationsLayout.vue'));

const BuildDataAppsLayout = load('BuildDataApps', () => import('@/domains/workbench/workflow/buildDataApps/BuildDataAppsLayout.vue'));

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

export const APP_ROUTES = [
    {
        path: '/',
        children: [
            { path: '', component: { render: (): null => null } }, // Matches exactly '/'. beforeEach handles the default redirect to knowledge about.
            { path: 'admin', children: [{ name: 'admin', path: '', component: AdminHomeLayout }] },
            { path: 'partner', children: [{ name: 'partner', path: '', component: PartnerHomeLayout }] },
            {
                path: 'workflow',
                children: [
                    { name: 'workflow', path: '', component: WorkflowHomeLayout },
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
                    { path: 'assembleDimensions', component: AssembleDimensionsLayout, children: [{ name: 'assembleDimensions', path: '', component: DimensionList }] },
                    { path: 'contextualiseData', component: ContextualiseDataLayout, children: [{ name: 'contextualiseData', path: '', component: EventQueryList }] },
                    { name: 'explorePresentations', path: 'explorePresentations', component: ExplorePresentationsLayout },
                    { name: 'buildDataApps', path: 'buildDataApps', component: BuildDataAppsLayout }
                ]
            }
        ]
    },
    { path: '/:catchAll(.*)', redirect: '/' }
];

// Router Creation Function
export const createAppRouter = (): Router => {
    const router = createRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: APP_ROUTES,
        scrollBehavior: handleScrollBehavior
    });

    // Default to /workflow when no workbench route or knowledge argument is present.
    router.beforeEach((to, from) => {
        if (from === START_LOCATION) {
            // Then the page is loading.
            if (to.query.wbState !== '1' && to.path !== '/') {
                // Then we can clear the workbench part of the url if it was not visible. This defers loading the view until required.
                return { path: '/', query: { ...to.query, d: undefined, wbState: undefined, wbView: to.query.wbView ?? 'workflow', kState: 1, kView: to.query.kView ?? 'about' } };
            } else if (to.path === '/' && (!('kView' in to.query) || !('kState' in to.query))) {
                return { path: '/workflow', query: { ...to.query, d: undefined, wbState: 1, wbView: 'workflow', kState: undefined, kView: undefined } };
            } else if ('d' in to.query) {
                return { path: to.path, query: { ...to.query, d: undefined } };
            }
        }

        routeLoadingState.start();
    });

    router.afterEach(() => routeLoadingState.complete());
    router.onError(() => routeLoadingState.fail());

    return router;
};

// UI Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleScrollBehavior(
    _to: Parameters<RouterScrollBehavior>[0],
    _from: Parameters<RouterScrollBehavior>[1],
    savedPosition: Parameters<RouterScrollBehavior>[2]
): ReturnType<RouterScrollBehavior> {
    return savedPosition ? { ...savedPosition, behavior: 'auto' } : { left: 0, top: 0 }; // NOTE: "behavior: 'auto'" required for Safari iOS v18.3.2.
}
