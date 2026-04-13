// TESTING: Promise.reject(new Error('Simulated chunk failure')).catch((error) => handleLoadError('explorePresentations', error))

// External Dependencies
import { createRouter, createWebHistory, type Router, type RouterScrollBehavior, START_LOCATION } from 'vue-router';

// App Core
import { load } from '@/utils/component';
import { completeNavigation, startNavigation } from '@/state/appProgress';

// App Components - Dynamically imported.
const AdminHomeLayout = load('admin', () => import('@/domains/workbench/admin/AdminHomeLayout.vue'));
const PartnerHomeLayout = load('partner', () => import('@/domains/workbench/partner/PartnerHomeLayout.vue'));
const WorkflowHomeLayout = load('workflow', () => import('@/domains/workbench/workflow/WorkflowHomeLayout.vue'));

const EstablishDataViewsLayout = load('establishDataViews', () => import('@/domains/workbench/workflow/establishDataViews/EstablishDataViewsLayout.vue'));
const DataViewList = load('establishDataViews', () => import('@/domains/workbench/workflow/establishDataViews/DataViewList.vue'));
const SelectConnectionPanel = load('selectConnection', () => import('@/domains/workbench/workflow/establishDataViews/SelectConnectionPanel.vue'));
const SelectNodePanel = load('selectNode', () => import('@/domains/workbench/workflow/establishDataViews/SelectNodePanel.vue'));
const AuditContentPanel = load('auditContent', () => import('@/domains/workbench/workflow/establishDataViews/AuditContentPanel.vue'));
const AuditRelationshipsPanel = load('auditRelationships', () => import('@/domains/workbench/workflow/establishDataViews/AuditRelationshipsPanel.vue'));
const TransformPanel = load('transform', () => import('@/domains/workbench/workflow/establishDataViews/TransformPanel.vue'));
const InvestigatePanel = load('investigate', () => import('@/domains/workbench/workflow/establishDataViews/InvestigatePanel.vue'));

const AssembleDimensionsLayout = load('assembleDimensions', () => import('@/domains/workbench/workflow/assembleDimensions/AssembleDimensionsLayout.vue'));
const DimensionList = load('assembleDimensions', () => import('@/domains/workbench/workflow/assembleDimensions/DimensionList.vue'));

const ContextualiseDataLayout = load('contextualiseData', () => import('@/domains/workbench/workflow/contextualiseData/ContextualiseDataLayout.vue'));
const EventQueryList = load('contextualiseData', () => import('@/domains/workbench/workflow/contextualiseData/EventQueryList.vue'));

const ExplorePresentationsLayout = load('explorePresentations', () => import('@/domains/workbench/workflow/explorePresentations/ExplorePresentationsLayout.vue'));

const BuildDataAppsLayout = load('buildDataApps', () => import('@/domains/workbench/workflow/buildDataApps/BuildDataAppsLayout.vue'));

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
                                    { name: 'selectNode', path: 'selectNode', component: SelectNodePanel },
                                    { name: 'auditContent', path: 'auditContent', component: AuditContentPanel },
                                    { name: 'auditRelationships', path: 'auditRelationships', component: AuditRelationshipsPanel },
                                    { name: 'transform', path: 'transform', component: TransformPanel },
                                    { name: 'investigate', path: 'investigate', component: InvestigatePanel }
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
        startNavigation();
    });

    router.afterEach(() => completeNavigation());
    router.onError(() => completeNavigation());

    return router;
};

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleScrollBehavior(
    _to: Parameters<RouterScrollBehavior>[0],
    _from: Parameters<RouterScrollBehavior>[1],
    savedPosition: Parameters<RouterScrollBehavior>[2]
): ReturnType<RouterScrollBehavior> {
    return savedPosition ? { ...savedPosition, behavior: 'auto' } : { left: 0, top: 0 }; // NOTE: "behavior: 'auto'" required for Safari iOS v18.3.2.
}
