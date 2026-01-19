import { defineConfig, type Preset } from '@vite-pwa/assets-generator/config';

export const preset: Preset = {
    apple: { sizes: [180] },
    maskable: { sizes: [192, 512] },
    transparent: { sizes: [64, 192, 512], favicons: [[64, 'favicon.ico']] }
};

export default defineConfig({ images: ['public/favicon.svg'], preset });
