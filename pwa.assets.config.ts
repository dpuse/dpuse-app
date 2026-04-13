// External Dependencies
import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

// PWA Assets Configuration ────────────────────────────────────────────────────────────────────────────────────────────

export default defineConfig({
    headLinkOptions: { preset: '2023' },
    preset,
    images: ['public/favicon.svg']
});
