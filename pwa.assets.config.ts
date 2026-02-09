// Vendor dependencies
import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

// Configuration
export default defineConfig({
    headLinkOptions: { preset: '2023' },
    preset,
    images: ['public/favicon.svg']
});
