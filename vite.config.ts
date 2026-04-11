// External Dependencies
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
// import vueDevTools from 'vite-plugin-vue-devtools';
import { fileURLToPath, URL } from 'node:url';

// Vite Configuration ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default defineConfig({
    plugins: [vue(), /*vueDevTools(),*/ tailwindcss(), cloudflare()],
    resolve: {
        alias: {
            '~': fileURLToPath(new URL('.', import.meta.url)),
            '@': fileURLToPath(new URL('src', import.meta.url))
        }
    },
    build: {
        // chunkSizeWarningLimit: 600
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/@tanstack/ai')) {
                        // @tanstack/ai-client contains a CommonJS module that causes Rollup to place a CJS interop helper
                        // in the LibraryView chunk. This creates a static dependency from session (initial load) to
                        // LibraryView, forcing it to preload with the app. Isolating @tanstack/ai into its own chunk
                        // moves the helper out of LibraryView, keeping it truly lazy-loaded.
                        return 'ai-vendor';
                    }
                }
            }
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
                " connect-src 'self' https://localhost:5173 wss://localhost:5173 data: https://api.dpuse.app wss://api.dpuse.app https://engine-eu.dpuse.app https://sample-data-eu.dpuse.app https://aed89ef7-2e5e-4e63-ae1a-851bbe2d4bb1.hanko.io https://blockly-demo.appspot.com;" +
                " form-action 'none';" +
                " frame-ancestors 'none';" +
                " img-src 'self' https://gravatar.com https://flagcdn.com https://tailwindcss.com https://blockly-demo.appspot.com;" +
                " manifest-src 'self';" +
                " object-src 'none';" +
                " script-src 'self' https://engine-eu.dpuse.app 'wasm-unsafe-eval' 'sha256-HSvgr//xBF8qoKsX1FPA79evG6rtxroRm2NegRE7MHs=';" +
                " style-src 'self' 'unsafe-inline';" + // 'unsafe-inline' is required in dev mode as Vite injects Tailwind CSS as inline <style> elements for HMR. Hashes required in production are not required here because of 'unsafe-inline' setting.
                " worker-src 'self' blob:;" +
                ' trusted-types default vue;' +
                " require-trusted-types-for 'script';",
            'Cross-Origin-Resource-Policy': 'same-origin',
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self), clipboard-read=(self), clipboard-write=(self)',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        },
        https: {
            key: '../../localhost/localhost+1-key.pem',
            cert: '../../localhost/localhost+1.pem'
        }
    }
});
