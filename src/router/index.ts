// External Dependencies
import type { Component } from 'vue';
import { h } from 'vue';
import { createRouter, createWebHistory, type Router, type RouterScrollBehavior } from 'vue-router';

// App Core
import { completeNavigation, startNavigation } from '@/composables/useNavProgress';

// App Components - Statically imported so they are always available, including when offline.
import ChunkLoadError from '@/components/chunkLoadError/ChunkLoadError.vue';

// Constants
export const APP_ROUTES = [
    {
        path: '/',
        children: [
            { path: '', component: { render: (): null => null } }, // Matches exactly '/'. beforeEach handles the default redirect to knowledge home.
            {
                path: 'admin',
                children: [{ name: 'admin', path: '', component: (): Promise<Component> => import('@/views/workbench/admin/Admin.vue').catch((error) => handleChunkLoadError('admin', error)) }]
            },
            {
                path: 'partner',
                children: [
                    { name: 'partner', path: '', component: (): Promise<Component> => import('@/views/workbench/partner/Partner.vue').catch((error) => handleChunkLoadError('partner', error)) }
                ]
            },
            {
                path: 'workflow',
                children: [
                    { name: 'workflow', path: '', component: (): Promise<Component> => import('@/views/workbench/workflow/Workflow.vue').catch((error) => handleChunkLoadError('workflow', error)) },
                    {
                        path: 'establishDataViews',
                        component: (): Promise<Component> =>
                            import('@/views/workbench/workflow/establishDataViews/EstablishDataViews.vue').catch((error) => handleChunkLoadError('establishDataViews', error)),
                        children: [
                            {
                                name: 'establishDataViews',
                                path: '',
                                component: (): Promise<Component> =>
                                    import('@/views/workbench/workflow/establishDataViews/DataViewList.vue').catch((error) => handleChunkLoadError('establishDataViews', error))
                            },
                            {
                                name: 'connectionSelector',
                                path: 'connectionSelector',
                                component: (): Promise<Component> =>
                                    import('@/views/workbench/workflow/establishDataViews/ConnectionSelector.vue').catch((error) => handleChunkLoadError('connectionSelector', error))
                            }
                        ]
                    },
                    {
                        path: 'assembleDimensions',
                        component: (): Promise<Component> =>
                            import('@/views/workbench/workflow/assembleDimensions/AssembleDimensions.vue').catch((error) => handleChunkLoadError('assembleDimensions', error)),
                        children: [
                            {
                                name: 'assembleDimensions',
                                path: '',
                                component: (): Promise<Component> =>
                                    import('@/views/workbench/workflow/assembleDimensions/DimensionList.vue').catch((error) => handleChunkLoadError('assembleDimensions', error))
                            }
                        ]
                    },
                    {
                        path: 'contextualiseData',
                        component: (): Promise<Component> =>
                            import('@/views/workbench/workflow/contextualiseData/ContextualiseData.vue').catch((error) => handleChunkLoadError('contextualiseData', error)),
                        children: [
                            {
                                name: 'contextualiseData',
                                path: '',
                                component: (): Promise<Component> =>
                                    import('@/views/workbench/workflow/contextualiseData/EventQueryList.vue').catch((error) => handleChunkLoadError('contextualiseData', error))
                            }
                        ]
                    },
                    {
                        name: 'explorePresentations',
                        path: 'explorePresentations',
                        component: (): Promise<Component> =>
                            import('@/views/workbench/workflow/explorePresentations/ExplorePresentations.vue').catch((error) => handleChunkLoadError('explorePresentations', error))
                        // Promise.reject(new Error('Simulated chunk failure')).catch((error) => handleChunkLoadError('explorePresentations', error))
                    },
                    {
                        name: 'buildDataApps',
                        path: 'buildDataApps',
                        component: (): Promise<Component> => import('@/views/workbench/workflow/buildDataApps/BuildDataApps.vue').catch((error) => handleChunkLoadError('buildDataApps', error))
                    }
                ]
            }
        ]
    },
    { path: '/:catchAll(.*)', redirect: '/' }
];

// Application router with web history and scroll position restoration
export const createAppRouter = (): Router => {
    const router = createRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: APP_ROUTES,
        scrollBehavior: handleScrollBehavior
    });

    // Default to knowledge home when no workbench route or knowledge argument is present.
    router.beforeEach((to) => {
        startNavigation();
        if (to.path === '/' && !('knowledge' in to.query)) {
            return { path: '/', query: { ...to.query, knowledge: 'welcome' } };
        }
    });

    router.afterEach(() => completeNavigation());
    router.onError(() => completeNavigation());

    return router;
};

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleChunkLoadError(chunkName: string, error: unknown): { render: () => ReturnType<typeof h> } {
    return { render: (): ReturnType<typeof h> => h(ChunkLoadError, { chunkName, error }) };
}

// TODO: Following not exported by Vue router, duplicated here to address eslint function return type rule.
// type ScrollPositionCoordinates = { behavior?: ScrollOptions['behavior']; left?: number; top?: number };
// const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) => {
//     return savedPosition ? { ...savedPosition, behavior: 'auto' } : { left: 0, top: 0 }; // NOTE: "behavior: 'auto'" required for Safari iOS v18.3.2.
// };

function handleScrollBehavior(
    _to: Parameters<RouterScrollBehavior>[0],
    _from: Parameters<RouterScrollBehavior>[1],
    savedPosition: Parameters<RouterScrollBehavior>[2]
): ReturnType<RouterScrollBehavior> {
    return savedPosition ? { ...savedPosition, behavior: 'auto' } : { left: 0, top: 0 }; // NOTE: "behavior: 'auto'" required for Safari iOS v18.3.2.
}
