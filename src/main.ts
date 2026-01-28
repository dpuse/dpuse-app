// External dependencies
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Core
import App from '@/App.vue';
import router from '@/router';

// Styles
import '@/assets/main.css';

// Bootstrap workbench application
const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
