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
        { path: '/workflow', name: 'workflow', component: WorkflowHome },
        { path: '/account', name: 'account', component: () => import('@/views/account/Account.vue') },
        { path: '/settings', name: 'settings', component: () => import('@/views/settings/Settings.vue') },
        { path: '/:catchAll(.*)*', redirect: '/workflow' }
    ],
    scrollBehavior: (to, from, savedPosition): { behavior?: ScrollOptions['behavior']; left: number; top: number } => {
        return savedPosition ? { ...savedPosition, behavior: 'auto' } : { left: 0, top: 0 }; // NOTE: "behavior: 'auto'" required for Safari iOS v18.3.2.
    }
});

// Exposures.
export default router;
