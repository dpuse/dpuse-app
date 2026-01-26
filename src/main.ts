// External dependencies
import { createPinia } from 'pinia';
import { createApp, nextTick } from 'vue';

// Application modules
import App from '@/App.vue';
import router from '@/router';
import { useSessionStore } from '@/stores/sessionStore';

// Styles
import '@/assets/main.css';

// Bootstrap workbench application
const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');

// Initialise services
nextTick(() => {
    setTimeout(async () => {
        const hankoModulePromise = import('@teamhanko/hanko-frontend-sdk');
        await useSessionStore().initServices(hankoModulePromise);
    });
});
