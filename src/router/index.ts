// External Dependencies
import type { Component } from 'vue';
import { createRouter, createWebHistory, type Router, type RouterScrollBehavior } from 'vue-router';

// TODO: Not exported by Vue router, duplicated here to address eslint function return type rule
// type ScrollPositionCoordinates = { behavior?: ScrollOptions['behavior']; left?: number; top?: number };

export const appRoutes = [
    {
        path: '/',
        children: [
            { path: '', redirect: { name: 'workflow' } },
            { path: 'admin', children: [{ name: 'admin', path: '', component: (): Promise<Component> => import('@/views/workbench/admin/Admin.vue') }] },
            { path: 'partner', children: [{ name: 'partner', path: '', component: (): Promise<Component> => import('@/views/workbench/partner/Partner.vue') }] },
            {
                path: 'workflow',
                children: [
                    { name: 'workflow', path: '', component: (): Promise<Component> => import('@/views/workbench/workflow/Workflow.vue') },
                    {
                        path: 'establishDataViews',
                        component: (): Promise<Component> => import('@/views/workbench/workflow/establishDataViews/EstablishDataViews.vue'),
                        children: [
                            {
                                name: 'establishDataViews',
                                path: '',
                                component: (): Promise<Component> => import('@/views/workbench/workflow/establishDataViews/DataViewList.vue')
                            },
                            {
                                name: 'connectionSelector',
                                path: 'connectionSelector',
                                component: (): Promise<Component> => import('@/views/workbench/workflow/establishDataViews/ConnectionSelector.vue')
                            }
                        ]
                    },
                    {
                        path: 'assembleDimensions',
                        component: (): Promise<Component> => import('@/views/workbench/workflow/assembleDimensions/AssembleDimensions.vue'),
                        children: [
                            {
                                name: 'assembleDimensions',
                                path: '',
                                component: (): Promise<Component> => import('@/views/workbench/workflow/assembleDimensions/DimensionList.vue')
                            }
                        ]
                    },
                    {
                        path: 'contextualiseData',
                        component: (): Promise<Component> => import('@/views/workbench/workflow/contextualiseData/ContextualiseData.vue'),
                        children: [
                            {
                                name: 'contextualiseData',
                                path: '',
                                component: (): Promise<Component> => import('@/views/workbench/workflow/contextualiseData/EventQueryList.vue')
                            }
                        ]
                    },
                    {
                        name: 'explorePresentations',
                        path: 'explorePresentations',
                        component: (): Promise<Component> => import('@/views/workbench/workflow/explorePresentations/ExplorePresentations.vue')
                    },
                    {
                        name: 'buildDataApps',
                        path: 'buildDataApps',
                        component: (): Promise<Component> => import('@/views/workbench/workflow/buildDataApps/BuildDataApps.vue')
                    }
                ]
            }
        ]
    },
    { path: '/:catchAll(.*)', redirect: '/workflow' }
];

const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) => {
    return savedPosition ? { ...savedPosition, behavior: 'auto' } : { left: 0, top: 0 }; // NOTE: "behavior: 'auto'" required for Safari iOS v18.3.2.
};

// Application router with web history and scroll position restoration
export const createAppRouter = (): Router =>
    createRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: appRoutes,
        scrollBehavior
    });
