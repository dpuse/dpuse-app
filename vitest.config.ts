// ── External Dependencies & Registrations
import { fileURLToPath } from 'node:url';
// import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
// import viteConfig from './vite.config'
import vue from '@vitejs/plugin-vue';
import { configDefaults, defineConfig } from 'vitest/config';

// Dedicated Vitest config that mirrors only the bits we need from Vite, but
// intentionally omits the Cloudflare plugin which is incompatible with Vitest's
// resolve.external behavior.
// export default mergeConfig(
//   viteConfig,
//   defineConfig({
//     test: {
//       environment: 'jsdom',
//       exclude: [...configDefaults.exclude, 'e2e/**'],
//       root: fileURLToPath(new URL('./', import.meta.url)),
//     },
//   }),
// )

// ── Vitest Configuration ─────────────────────────────────────────────────────────────────────────────────────────────

const config = defineConfig({
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => tag.startsWith('hanko-')
                }
            }
        })
    ],
    resolve: {
        alias: {
            '~': fileURLToPath(new URL('.', import.meta.url)),
            '@': fileURLToPath(new URL('src', import.meta.url))
        }
    },
    test: {
        coverage: {
            // 'json' writes the coverage-final.json that `fallow health --coverage` reads; 'json-summary' writes the totals
            // the README's Testing table reports.
            exclude: ['dist/**', 'scripts/**', 'tests/**'],
            include: ['src/**/*.{ts,vue}'],
            provider: 'v8',
            reporter: ['text', 'json', 'json-summary'],
            reportsDirectory: './coverage'
        },
        environment: 'jsdom',
        exclude: [...configDefaults.exclude, 'e2e/**'],
        include: ['tests/**/*.test.ts'],
        setupFiles: ['./tests/support/setup.ts'],
        root: fileURLToPath(new URL('./', import.meta.url))
    }
});

export default config;
