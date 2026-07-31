// ── External Dependencies & Registrations
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';
import Sonda from 'sonda/vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// ── Vite Configuration ───────────────────────────────────────────────────────────────────────────────────────────────

export default defineConfig({
    build: {
        rollupOptions: {
            plugins: [Sonda({ filename: 'index', format: 'json', brotli: true, gzip: false, open: false, outputDir: './bundle-analysis-reports/sonda' })]
        }
    },
    plugins: [vue(), /*vueDevTools(),*/ tailwindcss(), cloudflare()],
    resolve: {
        alias: {
            '~': fileURLToPath(new URL('.', import.meta.url)),
            '@': fileURLToPath(new URL('src', import.meta.url))
        }
    },
    server: {
        headers: {
            'Content-Security-Policy':
                "default-src 'none';" +
                " base-uri 'self';" +
                " connect-src 'self' https://localhost:5173 wss://localhost:5173 data: https://api.dpuse.app wss://api.dpuse.app https://engine-eu.dpuse.app https://sample-data-eu.dpuse.app https://aed89ef7-2e5e-4e63-ae1a-851bbe2d4bb1.hanko.io wss://dpuse-partykit.terrell-jm.workers.dev;" +
                " form-action 'none';" +
                " frame-ancestors 'none';" +
                " frame-src 'none';" +
                " img-src 'self' blob: https://gravatar.com;" +
                " manifest-src 'self';" +
                " object-src 'none';" +
                " script-src 'self' https://engine-eu.dpuse.app 'wasm-unsafe-eval' 'sha256-HSvgr//xBF8qoKsX1FPA79evG6rtxroRm2NegRE7MHs=';" +
                " style-src 'self' blob: https://engine-eu.dpuse.app 'unsafe-inline';" + // blob: is for SpeedHighlight in MicroMarkTool; https://engine-eu.dpuse.app is for dynamically-loaded tool stylesheets (e.g. dpuse-tool-d3's Billboard.js CSS); 'unsafe-inline' is required in dev mode as Vite injects Tailwind CSS as inline <style> elements for HMR. Hashes required in production are not required here because of 'unsafe-inline' setting.
                " worker-src 'self' blob:;" +
                ' trusted-types default vue dompurify highcharts;' +
                " require-trusted-types-for 'script';",
            'Cross-Origin-Resource-Policy': 'same-origin',
            'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', // '-allow-popups' suffix is required for vendor (Dropbox...) authentication window popups.
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self), clipboard-read=(self), clipboard-write=(self)',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        },
        // Configure localhost deployment to use 'https'. This is required for desktop Safari.
        https: {
            key: '../../localhost/localhost+1-key.pem',
            cert: '../../localhost/localhost+1.pem'
        }
    },
    worker: {
        format: 'es'
    }
});
