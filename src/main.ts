// Vendor dependencies
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Application core
import '@/assets/main.css';
import App from '@/App.vue';
import router from '@/router';

const importPromise = import('@teamhanko/hanko-frontend-sdk');

// Bootstrap workbench application
try {
    const app = createApp(App);
    app.use(createPinia());
    app.use(router);
    app.mount('#app');
    // eslint-disable-next-line unicorn/prefer-top-level-await
    import('@/stores/sessionStore').then((module) => {
        console.log(3333);
        module.useSessionStore().initServices(importPromise);
        console.log(4444);
    });
    console.log(2222);
} catch (error) {
    reportBootstrapError(error);
}

function reportBootstrapError(error: unknown): void {
    console.log(error);
    // TODO: Insert error into the dom...
    // TODO: Attempt to send to error tracker...
}
