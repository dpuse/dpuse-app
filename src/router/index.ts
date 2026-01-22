// Vendor dependencies.
import { createRouter, createWebHistory } from 'vue-router';

// View dependencies.
import Workflow from '@/views/workflow/Workflow.vue';

// Application router with scroll position restoration.
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', redirect: '/workflow/home' },
        { path: '/admin', name: 'admin', component: () => import('@/views/admin/AdminHome.vue') },
        { path: '/partner', name: 'partner', component: () => import('@/views/partner/PartnerHome.vue') },
        {
            path: '/workflow',
            component: Workflow,
            children: [
                { path: '', name: 'workflow', redirect: '/workflow/home' },
                { path: 'home', name: 'workflowHome', component: () => import('@/views/workflow/WorkflowHome.vue') },
                { path: 'establishDataViews', name: 'establishDataViews', component: () => import('@/views/workflow/establishDataViews/EstablishDataViews.vue') },
                { path: 'assembleDimensions', name: 'assembleDimensions', component: () => import('@/views/workflow/assembleDimensions/AssembleDimensions.vue') },
                { path: 'contextualiseData', name: 'contextualiseData', component: () => import('@/views/workflow/contextualiseData/ContextualiseData.vue') },
                { path: 'explorePresentations', name: 'explorePresentations', component: () => import('@/views/workflow/explorePresentations/ExplorePresentations.vue') },
                { path: 'buildDataApps', name: 'buildDataApps', component: () => import('@/views/workflow/buildDataApps/BuildDataApps.vue') }
            ]
        },
        {
            path: '/account',
            component: () => import('@/views/account/Account.vue'),
            children: [
                { path: '', name: 'account', redirect: '/account/managePersonalDetails' },
                { path: 'managePersonalDetails', name: 'managePersonalDetails', component: () => import('@/views/account/ManagePersonalDetails.vue') },
                { path: 'manageSubscription', name: 'manageSubscription', component: () => import('@/views/account/ManageSubscription.vue') },
                { path: 'managePreferences', name: 'managePreferences', component: () => import('@/views/account/ManagePreferences.vue') },
                { path: 'manageAccess', name: 'manageAccess', component: () => import('@/views/account/ManageAccess.vue') },
                { path: 'manageSessions', name: 'manageSessions', component: () => import('@/views/account/ManageSessions.vue') },
                { path: 'reviewActivity', name: 'reviewActivity', component: () => import('@/views/account/ReviewActivity.vue') },
                { path: 'manageDataServiceTokens', name: 'manageDataServiceTokens', component: () => import('@/views/account/ManageDataServiceTokens.vue') },
                { path: 'generateToken', name: 'generateToken', component: () => import('@/views/account/GenerateToken.vue') },
                { path: 'deleteAccount', name: 'deleteAccount', component: () => import('@/views/account/DeleteAccount.vue') }
            ]
        },
        { path: '/settings', name: 'settings', component: () => import('@/views/settings/Settings.vue') },
        { path: '/:catchAll(.*)*', redirect: '/workflow' }
    ],
    scrollBehavior: (to, from, savedPosition): { behavior?: ScrollOptions['behavior']; left: number; top: number } => {
        return savedPosition ? { ...savedPosition, behavior: 'auto' } : { left: 0, top: 0 }; // NOTE: "behavior: 'auto'" required for Safari iOS v18.3.2.
    }
});

// Exposures.
export default router;
