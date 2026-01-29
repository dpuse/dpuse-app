// Vendor dependencies
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Application core
import '@/assets/main.css';
import App from '@/App.vue';
import router from '@/router';

// Bootstrap workbench application
try {
    const app = createApp(App);
    app.use(createPinia());
    import('@/stores/sessionStore').then((module) => module.useSessionStore().initServices());
    app.use(router);
    app.mount('#app');
} catch (error) {
    reportBootstrapError(error);
}

function reportBootstrapError(error: unknown): void {
    console.log(error);
    // TODO: Insert error into the dom...
    // TODO: Attempt to send to error tracker...
}
