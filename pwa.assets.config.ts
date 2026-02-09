// Vendor dependencies
import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

// Configuration
// export const preset: Preset = {
//     apple: { sizes: [180] },
//     maskable: { sizes: [192, 512] },
//     transparent: { sizes: [64, 192, 512], favicons: [[64, 'favicon.ico']] }
// };
// export default defineConfig({ images: ['public/favicon.svg'], preset });

// Configuration
export default defineConfig({
    headLinkOptions: { preset: '2023' },
    preset,
    images: ['public/favicon.svg']
});
