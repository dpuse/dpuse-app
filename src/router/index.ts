// Vendor dependencies
import { createRouter, createWebHistory, type RouterScrollBehavior } from 'vue-router';

// Workbench components
import Workflow from '@/views/workflow/Workflow.vue';

// Not exported by Vue router, duplicated here to address eslint function return type rule
// type ScrollPositionCoordinates = { behavior?: ScrollOptions['behavior']; left?: number; top?: number };

export const appRoutes = [
    {
        path: '/',
        children: [
            { path: '', redirect: { name: 'workflow' } },
            { path: 'admin', children: [{ name: 'admin', path: '', component: () => import('@/views/admin/Admin.vue') }] },
            { path: 'partner', children: [{ name: 'partner', path: '', component: () => import('@/views/partner/Partner.vue') }] },
            {
                path: 'workflow',
                children: [
                    { name: 'workflow', path: '', component: Workflow },
                    { name: 'establishDataViews', path: 'establishDataViews', component: () => import('@/views/workflow/establishDataViews/EstablishDataViews.vue') },
                    { name: 'assembleDimensions', path: 'assembleDimensions', component: () => import('@/views/workflow/assembleDimensions/AssembleDimensions.vue') },
                    { name: 'contextualiseData', path: 'contextualiseData', component: () => import('@/views/workflow/contextualiseData/ContextualiseData.vue') },
                    { name: 'explorePresentations', path: 'explorePresentations', component: () => import('@/views/workflow/explorePresentations/ExplorePresentations.vue') },
                    { name: 'buildDataApps', path: 'buildDataApps', component: () => import('@/views/workflow/buildDataApps/BuildDataApps.vue') }
                ]
            },
            {
                path: 'account',
                component: () => import('@/views/account/Account.vue'),
                children: [
                    { name: 'account', path: '', redirect: { name: 'managePersonalDetails' } },
                    { name: 'managePersonalDetails', path: 'managePersonalDetails', component: () => import('@/views/account/ManagePersonalDetails.vue') },
                    { name: 'manageSubscription', path: 'manageSubscription', component: () => import('@/views/account/ManageSubscription.vue') },
                    { name: 'managePreferences', path: 'managePreferences', component: () => import('@/views/account/ManagePreferences.vue') },
                    { name: 'manageAccess', path: 'manageAccess', component: () => import('@/views/account/ManageAccess.vue') },
                    { name: 'manageSessions', path: 'manageSessions', component: () => import('@/views/account/ManageSessions.vue') },
                    { name: 'reviewActivity', path: 'reviewActivity', component: () => import('@/views/account/ReviewActivity.vue') },
                    { name: 'manageDataServiceTokens', path: 'manageDataServiceTokens', component: () => import('@/views/account/ManageDataServiceTokens.vue') },
                    { name: 'generateToken', path: 'generateToken', component: () => import('@/views/account/GenerateToken.vue') },
                    { name: 'deleteAccount', path: 'deleteAccount', component: () => import('@/views/account/DeleteAccount.vue') }
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
export const createAppRouter = () =>
    createRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: appRoutes,
        scrollBehavior
    });

export default createAppRouter();
