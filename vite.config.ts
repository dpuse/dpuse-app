// External Dependencies
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
// import vueDevTools from 'vite-plugin-vue-devtools';
import { fileURLToPath, URL } from 'node:url';

// Vite Configuration
export default defineConfig({
    plugins: [vue(), /*vueDevTools(),*/ tailwindcss(), cloudflare()],
    resolve: {
        alias: {
            '~': fileURLToPath(new URL('.', import.meta.url)),
            '@': fileURLToPath(new URL('src', import.meta.url))
        }
    },
    worker: {
        format: 'es'
    },
    server: {
        headers: {
            'Content-Security-Policy':
                "default-src 'none';" +
                " base-uri 'self';" +
                " connect-src 'self' http://localhost:5173 ws://localhost:5173 data: https://api.datapos.app wss://api.datapos.app https://engine-eu.datapos.app https://sample-data-eu.datapos.app https://aed89ef7-2e5e-4e63-ae1a-851bbe2d4bb1.hanko.io https://eu.i.posthog.com https://eu-assets.i.posthog.com;" +
                " form-action 'none';" +
                " frame-ancestors 'none';" +
                " img-src 'self' https://gravatar.com https://flagcdn.com;" +
                " manifest-src 'self';" +
                " object-src 'none';" +
                " script-src 'self' https://engine-eu.datapos.app 'wasm-unsafe-eval' 'sha256-KG2wj49jjwMy8lKXGdeUFXZ/WLdgASNCo7M8X7Jny6A=';" +
                " style-src 'self' 'unsafe-inline';" + // 'unsafe-inline' is required in dev mode as Vite injects Tailwind CSS as inline <style> elements for HMR. Hashes required in production are not required here because of 'unsafe-inline' setting.
                " worker-src 'self' blob:;" +
                ' trusted-types default vue;' +
                " require-trusted-types-for 'script';",
            'Cross-Origin-Resource-Policy': 'same-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self), clipboard-read=(self), clipboard-write=(self)',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
    }
});
