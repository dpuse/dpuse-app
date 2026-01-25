// External dependencies
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Application modules
import App from '@/App.vue';
import router from '@/router';

// Styles
import '@/assets/main.css';

import { useSessionStore } from '@/stores/sessionStore';

// Preload modules...
const hankoModulePromise = import('@teamhanko/hanko-frontend-sdk');

// Bootstrap workbench application
const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');

// Initialise services...
requestAnimationFrame(async () => {
    const sessionPromise = useSessionStore().initServices(hankoModulePromise);
    await sessionPromise;
});
