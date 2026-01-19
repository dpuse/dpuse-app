// Vendor dependencies.
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Workbench dependencies.
import App from './App.vue';
import router from './router';

// Bootstrap workbench app.
const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
