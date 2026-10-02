// ── External Dependencies & Registrations
import browserslist from 'browserslist';
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';
import { getUserAgentRegex } from 'browserslist-useragent-regexp';
import Sonda from 'sonda/vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// ── DPUse Framework
import { recordShippedPackages } from '@dpuse/dpuse-development/vite';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Only the engines worth naming to a user. 'ios_saf' is left out because it shares Safari's version number, and
// showing both would read as two separate requirements.
const BROWSER_DISPLAY_NAMES: Record<string, string | undefined> = { chrome: 'Chrome', edge: 'Edge', firefox: 'Firefox', safari: 'Safari' };

// ── Derived Configuration ────────────────────────────────────────────────────────────────────────────────────────────

// Everything below comes from 'browserslist' in 'package.json', so the build target, the check that runs in the
// browser and the message the user reads cannot drift apart.
const minimumVersions = new Map<string, number>();
for (const entry of browserslist()) {
    const [name, version] = entry.split(' ', 2);
    const displayName = BROWSER_DISPLAY_NAMES[name];
    if (displayName === undefined) continue;

    const majorVersion = Number(version);
    const lowestSoFar = minimumVersions.get(displayName);
    if (lowestSoFar === undefined || majorVersion < lowestSoFar) minimumVersions.set(displayName, majorVersion);
}

const supportedBrowsersText = [...minimumVersions].map(([name, version]) => `${name} ${String(version)}`).join(', ');

// ── Vite Configuration ───────────────────────────────────────────────────────────────────────────────────────────────

export default defineConfig({
    build: {
        rollupOptions: {
            plugins: [Sonda({ filename: 'index', format: 'json', brotli: false, gzip: true, open: false, outputDir: './bundle-analysis-reports/sonda' })]
        },
        sourcemap: 'hidden',
        // Kept in step with 'browserslist' in 'package.json' and the Browser Support table in 'README.md'. Vite does
        // not read 'browserslist', so without this it would transpile to its own lower default.
        target: ['chrome123', 'edge123', 'firefox148', 'safari26', 'ios26']
    },
    define: {
        __SUPPORTED_BROWSERS_TEXT__: JSON.stringify(supportedBrowsersText),
        // Inlined as a regex literal, so nothing from 'browserslist-useragent-regexp' reaches the browser.
        // 'allowHigherVersions' keeps browsers released after this build matching.
        __SUPPORTED_BROWSER_REGEXP__: getUserAgentRegex({ allowHigherVersions: true }).toString()
    },
    // 'recordShippedPackages' writes the record of what the build ships, which 'npm run document' lists licences from.
    plugins: [vue(), /*vueDevTools(),*/ tailwindcss(), cloudflare(), recordShippedPackages()],
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
                " font-src 'self';" +
                " form-action 'none';" +
                " frame-ancestors 'none';" +
                " frame-src 'none';" +
                " img-src 'self' blob: https://gravatar.com;" +
                " manifest-src 'self';" +
                " object-src 'none';" +
                " script-src 'self' https://engine-eu.dpuse.app 'wasm-unsafe-eval' 'sha256-HSvgr//xBF8qoKsX1FPA79evG6rtxroRm2NegRE7MHs=';" +
                // Billboard.js and Observable Plot means this prior more restrictive version need to be changes to use 'unsafe-online' - "style-src 'self' blob: https://engine-eu.dpuse.app 'sha256-SdKjLjFfgWLlCCSqd9sP4eqvpEsB18lplK/UUx0ukfk=' 'nonce-highcharts";'
                " style-src 'self' blob: https://engine-eu.dpuse.app 'unsafe-inline';" + // blob: is for SpeedHighlight in MicroMarkTool; https://engine-eu.dpuse.app is for dynamically-loaded tool stylesheets (e.g. dpuse-tool-d3-visualiser's Billboard.js CSS); 'unsafe-inline' is required in dev mode as Vite injects Tailwind CSS as inline <style> elements for HMR. Hashes required in production are not required here because of 'unsafe-inline' setting.
                " worker-src 'self' blob:;" +
                " trusted-types default vue dompurify highcharts 'allow-duplicates';" +
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
