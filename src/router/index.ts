// Vendor dependencies.
import { createRouter, createWebHistory } from 'vue-router';

// View dependencies.
import WorkflowHome from '@/views/workflow/WorkflowHome.vue';

// Application router with scroll position restoration.
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', redirect: '/workflow' },
        { path: '/admin', name: 'admin', component: () => import('@/views/admin/AdminHome.vue') },
        { path: '/partner', name: 'partner', component: () => import('@/views/partner/PartnerHome.vue') },
        {
            path: '/workflow',
            name: 'workflow',
            component: WorkflowHome,
            children: [
                { path: 'establishDataViews', name: 'establishDataViews', component: () => import('@/views/workflow/establishDataViews/EstablishDataViews.vue') },
                { path: 'assembleDimensions', name: 'assembleDimensions', component: () => import('@/views/workflow/assembleDimensions/AssembleDimensions.vue') },
                { path: 'contextualiseData', name: 'contextualiseData', component: () => import('@/views/workflow/contextualiseData/ContextualiseData.vue') },
                { path: 'explorePresentations', name: 'explorePresentations', component: () => import('@/views/workflow/explorePresentations/ExplorePresentations.vue') },
                { path: 'buildDataApps', name: 'buildDataApps', component: () => import('@/views/workflow/buildDataApps/BuildDataApps.vue') }
            ]
        },
        {
            path: '/account',
            name: 'account',
            component: () => import('@/views/account/Account.vue'),
            children: [
                { path: 'manageAccess', name: 'manageAccess', component: () => import('@/views/account/ManageAccess.vue') },
                { path: 'manageBillingDetails', name: 'manageBillingDetails', component: () => import('@/views/account/ManageBillingDetails.vue') },
                { path: 'manageDataServices', name: 'manageDataServices', component: () => import('@/views/account/ManageDataServices.vue') },
                { path: 'managePersonalDetails', name: 'managePersonalDetails', component: () => import('@/views/account/ManagePersonalDetails.vue') },
                { path: 'manageSessions', name: 'manageSessions', component: () => import('@/views/account/ManageSessions.vue') },
                { path: 'manageSettings', name: 'manageSettings', component: () => import('@/views/account/ManageSettings.vue') },
                { path: 'reviewActivity', name: 'reviewActivity', component: () => import('@/views/account/ReviewActivity.vue') },
                { path: 'generateToken', name: 'generateToken', component: () => import('@/views/account/GenerateToken.vue') }
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
