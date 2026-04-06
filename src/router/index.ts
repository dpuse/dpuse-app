// TESTING: Promise.reject(new Error('Simulated chunk failure')).catch((error) => handleLoadError('explorePresentations', error))

// External Dependencies
import type { Component } from 'vue';
import { h } from 'vue';
import { createRouter, createWebHistory, type Router, type RouterScrollBehavior, START_LOCATION } from 'vue-router';

// App Core
import { completeNavigation, startNavigation } from '@/composables/useNavProgress';

// App Components - Statically imported so always available, even when offline.
import ChunkLoadError from '@/components/chunkLoadError/ChunkLoadError.vue';

// App Components - Lazy loaded as required.
const AdminHomeView = lazyLoad('admin', () => import('@/views/workbench/admin/AdminHomeView.vue'));
const PartnerHomeView = lazyLoad('partner', () => import('@/views/workbench/partner/PartnerHomeView.vue'));
const WorkflowHomeView = lazyLoad('workflow', () => import('@/views/workbench/workflow/WorkflowHomeView.vue'));

const EstablishDataViewsLayout = lazyLoad('establishDataViews', () => import('@/views/workbench/workflow/establishDataViews/EstablishDataViewsLayout.vue'));
const DataViewList = lazyLoad('establishDataViews', () => import('@/views/workbench/workflow/establishDataViews/DataViewList.vue'));
const SelectConnectionPanel = lazyLoad('selectConnection', () => import('@/views/workbench/workflow/establishDataViews/SelectConnectionPanel.vue'));
const SelectNodePanel = lazyLoad('selectNode', () => import('@/views/workbench/workflow/establishDataViews/SelectNodePanel.vue'));
const AuditContentPanel = lazyLoad('auditContent', () => import('@/views/workbench/workflow/establishDataViews/AuditContentPanel.vue'));
const AuditRelationshipsPanel = lazyLoad('auditRelationships', () => import('@/views/workbench/workflow/establishDataViews/AuditRelationshipsPanel.vue'));
const TransformPanel = lazyLoad('transform', () => import('@/views/workbench/workflow/establishDataViews/TransformPanel.vue'));
const InvestigatePanel = lazyLoad('investigate', () => import('@/views/workbench/workflow/establishDataViews/InvestigatePanel.vue'));

const AssembleDimensionsLayout = lazyLoad('assembleDimensions', () => import('@/views/workbench/workflow/assembleDimensions/AssembleDimensionsLayout.vue'));
const DimensionList = lazyLoad('assembleDimensions', () => import('@/views/workbench/workflow/assembleDimensions/DimensionList.vue'));

const ContextualiseDataLayout = lazyLoad('contextualiseData', () => import('@/views/workbench/workflow/contextualiseData/ContextualiseDataLayout.vue'));
const EventQueryList = lazyLoad('contextualiseData', () => import('@/views/workbench/workflow/contextualiseData/EventQueryList.vue'));

const ExplorePresentationsView = lazyLoad('explorePresentations', () => import('@/views/workbench/workflow/explorePresentations/ExplorePresentationsView.vue'));

const BuildDataAppsView = lazyLoad('buildDataApps', () => import('@/views/workbench/workflow/buildDataApps/BuildDataAppsView.vue'));

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const APP_ROUTES = [
    {
        path: '/',
        children: [
            { path: '', component: { render: (): null => null } }, // Matches exactly '/'. beforeEach handles the default redirect to knowledge about.
            { path: 'admin', children: [{ name: 'admin', path: '', component: AdminHomeView }] },
            { path: 'partner', children: [{ name: 'partner', path: '', component: PartnerHomeView }] },
            {
                path: 'workflow',
                children: [
                    { name: 'workflow', path: '', component: WorkflowHomeView },
                    {
                        path: 'establishDataViews',
                        component: EstablishDataViewsLayout,
                        children: [
                            { name: 'establishDataViews', path: '', component: DataViewList },
                            { name: 'selectConnection', path: 'selectConnection', component: SelectConnectionPanel },
                            { name: 'selectNode', path: 'selectNode', component: SelectNodePanel },
                            { name: 'auditContent', path: 'auditContent', component: AuditContentPanel },
                            { name: 'auditRelationships', path: 'auditRelationships', component: AuditRelationshipsPanel },
                            { name: 'transform', path: 'transform', component: TransformPanel },
                            { name: 'investigate', path: 'investigate', component: InvestigatePanel }
                        ]
                    },
                    { path: 'assembleDimensions', component: AssembleDimensionsLayout, children: [{ name: 'assembleDimensions', path: '', component: DimensionList }] },
                    { path: 'contextualiseData', component: ContextualiseDataLayout, children: [{ name: 'contextualiseData', path: '', component: EventQueryList }] },
                    { name: 'explorePresentations', path: 'explorePresentations', component: ExplorePresentationsView },
                    { name: 'buildDataApps', path: 'buildDataApps', component: BuildDataAppsView }
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

function handleLoadError(chunkName: string, error: unknown): { render: () => ReturnType<typeof h> } {
    return { render: (): ReturnType<typeof h> => h(ChunkLoadError, { chunkName, error }) };
}

function handleScrollBehavior(
    _to: Parameters<RouterScrollBehavior>[0],
    _from: Parameters<RouterScrollBehavior>[1],
    savedPosition: Parameters<RouterScrollBehavior>[2]
): ReturnType<RouterScrollBehavior> {
    return savedPosition ? { ...savedPosition, behavior: 'auto' } : { left: 0, top: 0 }; // NOTE: "behavior: 'auto'" required for Safari iOS v18.3.2.
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function lazyLoad(chunkName: string, importFunction: () => Promise<Component>): () => Promise<Component> {
    return () => importFunction().catch((error) => handleLoadError(chunkName, error));
}
